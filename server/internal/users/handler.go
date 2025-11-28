package users

import (
	"net/http"
	"strconv"

	"github.com/rs/zerolog/log"
	"github.com/twilio/twilio-go"
	verify "github.com/twilio/twilio-go/rest/verify/v2"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"mithur-rannaghor.com/backend/middlewares"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}
func RegisterValidators() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {

		v.RegisterValidation("plan", func(fl validator.FieldLevel) bool {
			p := fl.Field().String()
			return p == "monthly" || p == "one_off"
		})
	}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	group := r.Group("/users")
	group.POST("/create", h.createUser)
	group.POST("/authenticate", h.sendOTP)
	group.POST("/verify", h.verifyOTP)

	// * Authorization middleware applied to protected routes
	protected := group.Group("/:id")
	protected.Use(middlewares.AuthzMiddleware())
	{
		protected.PUT("/address", h.updateAddress)
		protected.PUT("/plan", h.updatePlan)
	}

}

func (h *Handler) createUser(c *gin.Context) {
	var req createUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	user, err := h.repo.createUser(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *Handler) updateAddress(c *gin.Context) {
	var req updateAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	user, err := h.repo.updateAddress(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update address"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *Handler) updatePlan(c *gin.Context) {
	var req updatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	updatedUser, err := h.repo.addSubscription(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update plan"})
		return
	}

	c.JSON(http.StatusOK, updatedUser)
}

func (h *Handler) sendOTP(c *gin.Context) {
	var req validatePhoneNumberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	client := twilio.NewRestClient()
	params := &verify.CreateVerificationParams{}
	params.SetTo(req.Mobile_No)
	params.SetChannel("sms")

	resp, err := client.VerifyV2.CreateVerification("VAb3c4971f6367f33468605b4806a00045", params)
	if err != nil {
		log.Error().
			Err(err).
			Msg("Failed to send OTP")
		c.Status(http.StatusInternalServerError)
	} else {
		if resp.Sid != nil {
			log.Info().
				Str("mobile_no", *resp.To).
				Str("sid", *resp.Sid).
				Msg("OTP sent successfully")
			c.Status(http.StatusOK)

		} else {
			log.Error().
				Str("mobile_no", *resp.To).
				Msg("Failed to send OTP")
			c.Status(http.StatusInternalServerError)
		}
	}
}

func (h *Handler) verifyOTP(c *gin.Context) {
	var req verifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	client := twilio.NewRestClient()

	params := &verify.CreateVerificationCheckParams{}
	params.SetTo(req.Mobile_No)
	params.SetCode(req.OTP)

	resp, err := client.VerifyV2.CreateVerificationCheck("VAb3c4971f6367f33468605b4806a00045", params)
	if err != nil {
		log.Error().
			Err(err).
			Msg("Failed to verify OTP")
		c.Status(http.StatusInternalServerError)
	} else {
		if resp.Sid != nil {
			log.Info().
				Str("sid", *resp.Sid).
				Msg("OTP verified successfully")
			access_token, refresh_token, err := CreateJwtToken(c.Request.Context(), req.Mobile_No, *h.repo)
			if err != nil {
				log.Error().
					Err(err).
					Msg("Failed to generate token")
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			} else {
				c.JSON(http.StatusOK, &AuthSession{Access_Token: access_token, Refresh_Token: refresh_token})
			}
		} else {
			log.Error().
				Str("sid", *resp.Sid).
				Msg("Failed to verify OTP")
			c.Status(http.StatusUnauthorized)
		}
	}
}
