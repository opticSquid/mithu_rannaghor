package users

type Users struct {
	User_id     int64  `json:"user_id"`
	Name        string `json:"user_name"`
	Mobile_No   string `json:"mobile_no"`
	Building_No string `json:"building_no"`
	Room_No     string `json:"room_no"`
	Role        string `json:"role"`
	Plan        string `json:"plan"`
}

type createUserRequest struct {
	Name      string `json:"user_name" binding:"required"`
	Mobile_No string `json:"mobile_no" binding:"required, len=10"`
}

type updateAddressRequest struct {
	Building_No string `json:"building_no" binding:"required"`
	Room_No     string `json:"room_no" binding:"required"`
}

type updatePlanRequest struct {
	Plan string `json:"plan" binding:"required,plan"`
}

type validatePhoneNumberRequest struct {
	Mobile_No string `json:"mobile_no" binding:"required, len=10"`
}

type verifyOTPRequest struct {
	Mobile_No string `json:"mobile_no" binding:"required, len=10"`
	OTP       string `json:"otp" binding:"required,len=6"`
}

type AuthSession struct {
	Access_Token  string `json:"access_token"`
	Refresh_Token string `json:"refresh_token"`
}
