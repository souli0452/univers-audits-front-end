export interface PermissionDto {
  permissionKey: string;
  label:         string;
  description:   string;
  category:      string;
}

export interface RoleDto {
  roleKey:      string;
  label:        string;
  description:  string;
  icon:         string;
  severity:     string;
  displayOrder: number;
  visible:      boolean;
  isProtected:  boolean;
  permissions:  PermissionDto[];
}

export interface CreateRoleRequest {
  roleKey:         string;
  label:           string;
  description?:    string;
  icon?:           string;
  severity?:       string;
  displayOrder?:   number;
  permissionKeys?: string[];
}

export interface UpdateRoleRequest {
  label?:          string;
  description?:    string;
  icon?:           string;
  severity?:       string;
  displayOrder?:   number;
  visible?:        boolean;
  permissionKeys?: string[];
}
