export interface UpdateProfileRequest {
    firstName: string;
    lastName:  string;
    email:     string;
}

export interface ChangePasswordRequest {
    newPassword:     string;
    confirmPassword: string;
}
