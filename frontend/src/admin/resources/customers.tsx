import { List, Datagrid, TextField, EmailField, Edit, SimpleForm, TextInput, Create } from 'react-admin';

export const CustomerList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="name" label="Имя" />
      <TextField source="phone" label="Телефон" />
      <EmailField source="email" label="Email" />
      <TextField source="city" label="Город" />
    </Datagrid>
  </List>
);

export const CustomerEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Имя" fullWidth />
      <TextInput source="phone" label="Телефон" />
      <TextInput source="email" label="Email" />
      <TextInput source="region" label="Регион" />
      <TextInput source="city" label="Город" />
    </SimpleForm>
  </Edit>
);

export const CustomerCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Имя" fullWidth />
      <TextInput source="phone" label="Телефон" />
      <TextInput source="email" label="Email" />
      <TextInput source="region" label="Регион" />
      <TextInput source="city" label="Город" />
    </SimpleForm>
  </Create>
);
