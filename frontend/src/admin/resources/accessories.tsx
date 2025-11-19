import { List, Datagrid, TextField, NumberField, Edit, SimpleForm, TextInput, NumberInput, Create, SelectInput, BooleanInput } from 'react-admin';

export const AccessoryList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="name" label="Название" />
      <TextField source="category" label="Категория" />
      <NumberField source="price" label="Цена" options={{ style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }} />
      <TextField source="description" label="Описание" />
    </Datagrid>
  </List>
);

export const AccessoryEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Название" fullWidth />
      <SelectInput source="category" label="Категория" choices={[
        { id: 'loading', name: 'Погрузка' },
        { id: 'support', name: 'Опорные элементы' },
        { id: 'spare', name: 'Запасные части' },
        { id: 'cover', name: 'Тенты и каркасы' },
        { id: 'safety', name: 'Безопасность' },
        { id: 'guides', name: 'Направляющие' },
        { id: 'boat_support', name: 'Опоры для лодок' },
      ]} />
      <NumberInput source="price" label="Цена" />
      <BooleanInput source="required" label="Обязательный" />
      <TextInput source="image" label="URL изображения" fullWidth />
      <TextInput source="description" label="Описание" multiline fullWidth />
    </SimpleForm>
  </Edit>
);

export const AccessoryCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Название" fullWidth />
      <SelectInput source="category" label="Категория" choices={[
        { id: 'loading', name: 'Погрузка' },
        { id: 'support', name: 'Опорные элементы' },
        { id: 'spare', name: 'Запасные части' },
        { id: 'cover', name: 'Тенты и каркасы' },
        { id: 'safety', name: 'Безопасность' },
        { id: 'guides', name: 'Направляющие' },
        { id: 'boat_support', name: 'Опоры для лодок' },
      ]} />
      <NumberInput source="price" label="Цена" />
      <BooleanInput source="required" label="Обязательный" />
      <TextInput source="image" label="URL изображения" fullWidth />
      <TextInput source="description" label="Описание" multiline fullWidth />
    </SimpleForm>
  </Create>
);
