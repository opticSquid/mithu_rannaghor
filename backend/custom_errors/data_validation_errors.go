package customerrors

type ErrInvalidRole struct{}

func (e ErrInvalidRole) Error() string {
	return "invalid role: must be 'admin' or 'normal'"
}

type ErrInvalidPlan struct{}

func (e ErrInvalidPlan) Error() string {
	return "invalid plan: must be 'monthly' or 'one_off'"
}

type ErrInvalidMobileNo struct{}

func (e ErrInvalidMobileNo) Error() string {
	return "invalid mobile number: must be exactly 10 digits"
}

type ErrInvalidAddress struct{}

func (e ErrInvalidAddress) Error() string {
	return "invalid address: building number or room number cannot be empty"
}
