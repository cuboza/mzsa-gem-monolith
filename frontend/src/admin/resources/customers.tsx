import { 
  List, Datagrid, TextField, EmailField, Edit, SimpleForm, TextInput, Create,
  required, email, DeleteWithConfirmButton, EditButton,
  BulkDeleteButton, BulkExportButton, Filter, SearchInput
} from 'react-admin';

// Валидаторы
const validateRequired = required('Обязательное поле');
const validateEmail = email('Введите корректный email');
const validatePhone = required('Введите телефон');

// Bulk Actions
const CustomerBulkActions = () => (
  <>
    <BulkExportButton />
    <BulkDeleteButton mutationMode="pessimistic" />
  </>
);

const CustomerFilter = (props: any) => (
  <Filter {...props}>
    <SearchInput source="q" alwaysOn placeholder="Поиск по имени, телефону..." />
  </Filter>
);

export const CustomerList = () => (
  <List filters={<CustomerFilter />}>
    <Datagrid rowClick="edit" bulkActionButtons={<CustomerBulkActions />}>
      <TextField source="name" label="Имя" />
      <TextField source="phone" label="Телефон" />
      <EmailField source="email" label="Email" />
      <TextField source="city" label="Город" />
      <EditButton />
      <DeleteWithConfirmButton confirmTitle="Удалить клиента?" confirmContent="Вы уверены, что хотите удалить этого клиента?" />
    </Datagrid>
  </List>
);

export const CustomerEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm>
      <TextInput source="name" label="Имя" fullWidth validate={validateRequired} />
      <TextInput source="phone" label="Телефон" validate={validatePhone} />
      <TextInput source="email" label="Email" validate={validateEmail} />
      <TextInput source="region" label="Регион" />
      <TextInput source="city" label="Город" />
    </SimpleForm>
  </Edit>
);

export const CustomerCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Имя" fullWidth validate={validateRequired} />
      <TextInput source="phone" label="Телефон" validate={validatePhone} />
      <TextInput source="email" label="Email" validate={validateEmail} />
      <TextInput source="region" label="Регион" />
      <TextInput source="city" label="Город" />
    </SimpleForm>
  </Create>
);
