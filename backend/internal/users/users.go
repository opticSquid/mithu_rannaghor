package users

import customerrors "mithur-rannaghor.com/backend/custom_errors"

type Users struct {
	User_id     int64  `json:"user_id"`
	Name        string `json:"user_name"`
	Mobile_No   string `json:"mobile_no"`
	Building_No string `json:"building_no"`
	Room_No     string `json:"room_no"`
	Role        string `json:"role"`
	Plan        string `json:"plan"`
}

func (u *Users) Validate() error {
	if u.Role != "admin" && u.Role != "normal" {
		return &customerrors.ErrInvalidPlan{}
	}
	if u.Plan != "monthly" && u.Plan != "one_off" {
		return &customerrors.ErrInvalidPlan{}
	}
	if len(u.Mobile_No) != 10 {
		return &customerrors.ErrInvalidMobileNo{}
	}
	if u.Building_No == "" || u.Room_No == "" {
		return &customerrors.ErrInvalidAddress{}
	}
	return nil
}
