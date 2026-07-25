export interface PortalConfigItem {
  id:          string;
  configKey:   string;
  configValue: string;
  label:       string;
  description: string;
  valueType:   'TEXT' | 'IMAGE_URL' | 'COLOR' | 'PHONE' | 'URL' | 'HTML';
  groupName:   string;
  updatedAt:   string;
  updatedBy:   string;
}
