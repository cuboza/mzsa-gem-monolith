import {
  List, Datagrid, TextField, NumberField, EditButton, BooleanField,
  Edit, SimpleForm, TextInput, NumberInput, BooleanInput, Create, FunctionField,
  required, minValue, DeleteWithConfirmButton,
  BulkDeleteButton, BulkExportButton
} from 'react-admin';

// Валидаторы
const validateRequired = required('Обязательное поле');
const validatePrice = [required('Обязательное поле'), minValue(0, 'Цена не может быть отрицательной')];
const validateStock = minValue(0, 'Остаток не может быть отрицательным');

// Bulk Actions
const AccessoryBulkActions = () => (
  <>
    <BulkExportButton />
    <BulkDeleteButton mutationMode="pessimistic" />
  </>
);

// Компонент миниатюры изображения
const ThumbnailField = ({ source }: { source: string }) => (
  <FunctionField
    render={(record: any) => {
      const imageUrl = record?.[source];
      return imageUrl ? (
        <img 
          src={imageUrl} 
          alt="" 
          style={{ 
            width: 60, 
            height: 45, 
            objectFit: 'cover', 
            borderRadius: 4,
            backgroundColor: '#f3f4f6'
          }}
          onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.jpg'; }}
        />
      ) : (
        <div style={{ 
          width: 60, 
          height: 45, 
          backgroundColor: '#e5e7eb', 
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: 10
        }}>
          Нет фото
        </div>
      );
    }}
  />
);

export const AccessoryList = () => (
  <List>
    <Datagrid rowClick="edit" bulkActionButtons={<AccessoryBulkActions />}>
      <ThumbnailField source="image" />
      <TextField source="name" label="Название" />
      <TextField source="category" label="Категория" />
      <NumberField source="price" label="Цена" options={{ style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }} />
      <NumberField source="stock" label="Остаток" />
      <BooleanField source="isUniversal" label="Универсальный" />
      <EditButton />
      <DeleteWithConfirmButton confirmTitle="Удалить аксессуар?" confirmContent="Вы уверены, что хотите удалить этот аксессуар?" />
    </Datagrid>
  </List>
);

export const AccessoryEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm>
      <TextInput source="name" label="Название" fullWidth validate={validateRequired} />
      <TextInput source="category" label="Категория" />
      <NumberInput source="price" label="Цена" validate={validatePrice} />
      <NumberInput source="stock" label="Количество на складе" validate={validateStock} />
      <TextInput source="description" label="Описание" multiline fullWidth />
      <TextInput source="image" label="URL изображения" fullWidth />
      <BooleanInput source="isUniversal" label="Универсальный (для всех прицепов)" />
    </SimpleForm>
  </Edit>
);

export const AccessoryCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Название" fullWidth validate={validateRequired} />
      <TextInput source="category" label="Категория" />
      <NumberInput source="price" label="Цена" validate={validatePrice} />
      <NumberInput source="stock" label="Количество на складе" validate={validateStock} />
      <TextInput source="description" label="Описание" multiline fullWidth />
      <TextInput source="image" label="URL изображения" fullWidth />
      <BooleanInput source="isUniversal" label="Универсальный (для всех прицепов)" defaultValue={true} />
    </SimpleForm>
  </Create>
);
