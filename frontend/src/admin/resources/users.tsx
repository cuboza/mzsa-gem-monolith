import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    EmailField,
    BooleanField,
    EditButton,
    DeleteButton,
    Edit,
    SimpleForm,
    TextInput,
    SelectInput,
    BooleanInput,
    Create,
    required,
    minLength
} from 'react-admin';

const userFilters = [
    <TextInput source="q" label="Поиск" alwaysOn />,
];

export const UserList = () => (
    <List filters={userFilters}>
        <Datagrid rowClick="edit">
            <TextField source="username" label="Логин" />
            <TextField source="fullName" label="Имя" />
            <TextField source="role" label="Роль" />
            <BooleanField source="isActive" label="Активен" />
            <EditButton />
            <DeleteButton />
        </Datagrid>
    </List>
);

export const UserEdit = () => (
    <Edit title="Редактирование пользователя">
        <SimpleForm>
            <TextInput source="username" label="Логин" validate={[required(), minLength(3)]} />
            <TextInput source="password" label="Пароль (оставьте пустым, чтобы не менять)" type="password" />
            <TextInput source="fullName" label="Полное имя" validate={required()} />
            <SelectInput source="role" label="Роль" choices={[
                { id: 'admin', name: 'Администратор' },
                { id: 'manager', name: 'Менеджер' },
            ]} validate={required()} />
            <BooleanInput source="isActive" label="Активен" />
        </SimpleForm>
    </Edit>
);

export const UserCreate = () => (
    <Create title="Создание пользователя">
        <SimpleForm>
            <TextInput source="username" label="Логин" validate={[required(), minLength(3)]} />
            <TextInput source="password" label="Пароль" validate={[required(), minLength(6)]} type="password" />
            <TextInput source="fullName" label="Полное имя" validate={required()} />
            <SelectInput source="role" label="Роль" choices={[
                { id: 'admin', name: 'Администратор' },
                { id: 'manager', name: 'Менеджер' },
            ]} validate={required()} defaultValue="manager" />
            <BooleanInput source="isActive" label="Активен" defaultValue={true} />
        </SimpleForm>
    </Create>
);
