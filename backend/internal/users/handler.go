package users

import "github.com/gin-gonic/gin"

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	group := r.Group("/users")
	group.POST("/", h.createUser)
	group.GET("/:id", h.getUser)
}

func (h *Handler) createUser(c *gin.Context) {

}
