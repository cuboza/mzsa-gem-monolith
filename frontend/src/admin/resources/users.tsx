import React, { useState, useEffect } from 'react';
import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  EditButton,
  DeleteButton,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  required,
  minLength,
  useRecordContext,
  SaveButton,
  Toolbar,
  FunctionField,
} from 'react-admin';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Box,
  Chip,
  Alert,
  Paper,
  Divider,
  Button,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';

import {
  PERMISSION_MODULES,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_MANAGER_PERMISSIONS,
  type UserPermissions,
  type PermissionResource,
  type PermissionOperation,
  type PermissionModuleMeta,
} from '../../types';

// ========== КОМПОНЕНТ НАСТРОЙКИ ПРАВ ==========

interface PermissionsEditorProps {
  permissions: UserPermissions | undefined;
  role: 'admin' | 'manager';
  onChange: (permissions: UserPermissions) => void;
}

const PermissionsEditor: React.FC<PermissionsEditorProps> = ({ permissions, role, onChange }) => {
  // Используем права роли по умолчанию, если индивидуальные не заданы
  const defaultPerms = role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_MANAGER_PERMISSIONS;
  const currentPerms = permissions || defaultPerms;

  const handlePermissionChange = (
    resource: PermissionResource,
    operation: PermissionOperation,
    checked: boolean
  ) => {
    const resourcePerms = currentPerms[resource] || [];
    let newResourcePerms: PermissionOperation[];

    if (checked) {
      newResourcePerms = [...resourcePerms, operation];
    } else {
      newResourcePerms = resourcePerms.filter((op) => op !== operation);
    }

    onChange({
      ...currentPerms,
      [resource]: newResourcePerms,
    });
  };

  const handleSelectAll = (resource: PermissionResource, module: PermissionModuleMeta) => {
    const allOps = module.operations.map((op) => op.operation);
    onChange({
      ...currentPerms,
      [resource]: allOps,
    });
  };

  const handleDeselectAll = (resource: PermissionResource) => {
    onChange({
      ...currentPerms,
      [resource]: [],
    });
  };

  const applyDefaultPermissions = (targetRole: 'admin' | 'manager') => {
    const defaults = targetRole === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_MANAGER_PERMISSIONS;
    onChange({ ...defaults });
  };

  const getPermissionCount = (resource: PermissionResource, module: PermissionModuleMeta) => {
    const resourcePerms = currentPerms[resource] || [];
    return `${resourcePerms.length}/${module.operations.length}`;
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6">Индивидуальные права доступа</Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          Настройте индивидуальные права для этого пользователя. Права переопределяют стандартные права роли.
        </Alert>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Tooltip title="Установить полные права администратора">
            <Button
              size="small"
              variant="outlined"
              startIcon={<AdminPanelSettingsIcon />}
              onClick={() => applyDefaultPermissions('admin')}
            >
              Полные права
            </Button>
          </Tooltip>
          <Tooltip title="Установить ограниченные права менеджера">
            <Button
              size="small"
              variant="outlined"
              startIcon={<PersonIcon />}
              onClick={() => applyDefaultPermissions('manager')}
            >
              Права менеджера
            </Button>
          </Tooltip>
        </Box>
      </Paper>

      {PERMISSION_MODULES.map((module) => (
        <Accordion key={module.resource} defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography sx={{ fontWeight: 500, minWidth: 150 }}>
                {module.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {module.description}
              </Typography>
              <Chip
                size="small"
                label={getPermissionCount(module.resource, module)}
                color={
                  (currentPerms[module.resource]?.length || 0) === module.operations.length
                    ? 'success'
                    : (currentPerms[module.resource]?.length || 0) > 0
                    ? 'primary'
                    : 'default'
                }
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                size="small"
                variant="text"
                onClick={() => handleSelectAll(module.resource, module)}
              >
                Выбрать все
              </Button>
              <Button
                size="small"
                variant="text"
                color="secondary"
                onClick={() => handleDeselectAll(module.resource)}
              >
                Снять все
              </Button>
            </Box>
            <FormGroup>
              {module.operations.map((op) => {
                const isChecked = currentPerms[module.resource]?.includes(op.operation) || false;
                return (
                  <FormControlLabel
                    key={op.operation}
                    control={
                      <Checkbox
                        checked={isChecked}
                        onChange={(e) =>
                          handlePermissionChange(module.resource, op.operation, e.target.checked)
                        }
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">{op.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {op.description}
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 1 }}
                  />
                );
              })}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

// ========== КОМПОНЕНТ ФОРМЫ С ПРАВАМИ ==========

const UserFormContent = ({ isCreate = false }: { isCreate?: boolean }) => {
  const record = useRecordContext();
  const [permissions, setPermissions] = useState<UserPermissions | undefined>(undefined);
  const [role, setRole] = useState<'admin' | 'manager'>('manager');

  useEffect(() => {
    if (record) {
      setPermissions(record.permissions);
      setRole(record.role || 'manager');
    }
  }, [record]);

  const handleRoleChange = (newRole: 'admin' | 'manager') => {
    setRole(newRole);
    // При смене роли сбрасываем на права по умолчанию для новой роли
    const defaultPerms = newRole === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_MANAGER_PERMISSIONS;
    setPermissions(defaultPerms);
  };

  return (
    <>
      <TextInput
        source="username"
        label="Логин"
        validate={[required(), minLength(3)]}
        fullWidth
      />
      <TextInput
        source="password"
        label={isCreate ? 'Пароль' : 'Пароль (оставьте пустым, чтобы не менять)'}
        type="password"
        validate={isCreate ? [required(), minLength(6)] : []}
        fullWidth
      />
      <TextInput source="fullName" label="Полное имя" validate={required()} fullWidth />
      <SelectInput
        source="role"
        label="Роль"
        choices={[
          { id: 'admin', name: 'Администратор' },
          { id: 'manager', name: 'Менеджер' },
        ]}
        validate={required()}
        defaultValue="manager"
        onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'manager')}
        fullWidth
      />
      <BooleanInput source="isActive" label="Активен" defaultValue={true} />

      <Divider sx={{ my: 3 }} />

      <PermissionsEditor
        permissions={permissions}
        role={role}
        onChange={setPermissions}
      />

      {/* Скрытое поле для передачи permissions в форму */}
      <input type="hidden" name="permissions" value={JSON.stringify(permissions)} />
    </>
  );
};

// ========== КАСТОМНАЯ ТУЛБАР С ОБРАБОТКОЙ ПРАВ ==========

const CustomToolbar = () => {
  return (
    <Toolbar>
      <SaveButton />
    </Toolbar>
  );
};

// ========== ОТОБРАЖЕНИЕ ПРАВ В СПИСКЕ ==========

const PermissionsSummary = () => {
  const record = useRecordContext();
  if (!record || !record.permissions) {
    return <Chip label="По умолчанию" size="small" variant="outlined" />;
  }

  const perms = record.permissions as UserPermissions;
  const totalOps = Object.values(perms).flat().length;
  const maxOps = PERMISSION_MODULES.reduce((acc, m) => acc + m.operations.length, 0);

  if (totalOps === maxOps) {
    return <Chip label="Полные права" size="small" color="success" />;
  }
  if (totalOps === 0) {
    return <Chip label="Нет прав" size="small" color="error" />;
  }

  return (
    <Chip
      label={`${totalOps} операций`}
      size="small"
      color="primary"
      variant="outlined"
    />
  );
};

const RoleBadge = () => {
  const record = useRecordContext();
  if (!record) return null;

  const isAdmin = record.role === 'admin';
  return (
    <Chip
      icon={isAdmin ? <AdminPanelSettingsIcon /> : <PersonIcon />}
      label={isAdmin ? 'Администратор' : 'Менеджер'}
      size="small"
      color={isAdmin ? 'error' : 'primary'}
      variant="outlined"
    />
  );
};

// ========== ФИЛЬТРЫ ==========

const userFilters = [
  <TextInput key="q" source="q" label="Поиск" alwaysOn />,
  <SelectInput
    key="role"
    source="role"
    label="Роль"
    choices={[
      { id: 'admin', name: 'Администратор' },
      { id: 'manager', name: 'Менеджер' },
    ]}
    alwaysOn
  />,
];

// ========== ЭКСПОРТ КОМПОНЕНТОВ ==========

export const UserList = () => (
  <List filters={userFilters} sort={{ field: 'username', order: 'ASC' }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="username" label="Логин" />
      <TextField source="fullName" label="Имя" />
      <FunctionField label="Роль" render={() => <RoleBadge />} />
      <FunctionField label="Права" render={() => <PermissionsSummary />} />
      <BooleanField source="isActive" label="Активен" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const UserEdit = () => {
  const transform = async (data: any) => {
    // Парсим permissions из скрытого поля
    let permissions = data.permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch {
        permissions = undefined;
      }
    }

    return {
      ...data,
      permissions,
    };
  };

  return (
    <Edit
      title="Редактирование пользователя"
      mutationMode="pessimistic"
      transform={transform}
    >
      <SimpleForm toolbar={<CustomToolbar />}>
        <UserFormContent />
      </SimpleForm>
    </Edit>
  );
};

export const UserCreate = () => {
  const transform = (data: any) => {
    let permissions = data.permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch {
        permissions = undefined;
      }
    }

    // Если права не заданы, используем права по умолчанию для роли
    if (!permissions) {
      permissions = data.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_MANAGER_PERMISSIONS;
    }

    return {
      ...data,
      permissions,
    };
  };

  return (
    <Create title="Создание пользователя" transform={transform}>
      <SimpleForm toolbar={<CustomToolbar />}>
        <UserFormContent isCreate />
      </SimpleForm>
    </Create>
  );
};
