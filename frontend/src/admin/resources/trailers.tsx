import {
  List, Datagrid, TextField, NumberField, EditButton,
  Edit, SimpleForm, TextInput, SelectInput, NumberInput,
  Filter, SearchInput, Create, FunctionField,
  required, minValue, DeleteWithConfirmButton,
  BulkDeleteButton, BulkExportButton
} from 'react-admin';

// Валидаторы
const validateRequired = required('Обязательное поле');
const validatePrice = [required('Обязательное поле'), minValue(0, 'Цена не может быть отрицательной')];
const validateStock = minValue(0, 'Остаток не может быть отрицательным');

// Bulk Actions
const TrailerBulkActions = () => (
  <>
    <BulkExportButton />
    <BulkDeleteButton mutationMode="pessimistic" />
  </>
);

// Компонент миниатюры изображения
const ThumbnailField = ({ source }: { source: string }) => (
  <FunctionField
    render={(record: any) => {
      const imageUrl = record?.[source] || record?.images?.[0];
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

const TrailerFilter = (props: any) => (
  <Filter {...props}>
    <SearchInput source="q" alwaysOn placeholder="Поиск модели..." />
    <SelectInput source="category" choices={[
      { id: 'general', name: 'Универсальные' },
      { id: 'water', name: 'Лодочные' },
      { id: 'commercial', name: 'Коммерческие' }
    ]} />
  </Filter>
);

export const TrailerList = () => (
  <List filters={<TrailerFilter />}>
    <Datagrid rowClick="edit" bulkActionButtons={<TrailerBulkActions />}>
      <ThumbnailField source="image" />
      <TextField source="model" label="Модель" />
      <TextField source="name" label="Название" />
      <TextField source="category" label="Категория" />
      <NumberField source="price" label="Цена" options={{ style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }} />
      <NumberField source="stock" label="Остаток" />
      <TextField source="availability" label="Наличие" />
      <EditButton />
      <DeleteWithConfirmButton confirmTitle="Удалить прицеп?" confirmContent="Вы уверены, что хотите удалить этот прицеп?" />
    </Datagrid>
  </List>
);

export const TrailerEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm>
      <TextInput source="model" label="Модель" fullWidth validate={validateRequired} />
      <TextInput source="name" label="Название" fullWidth validate={validateRequired} />
      
      <SelectInput source="category" validate={validateRequired} choices={[
        { id: 'general', name: 'Универсальные' },
        { id: 'water', name: 'Лодочные' },
        { id: 'commercial', name: 'Коммерческие' }
      ]} />
      
      <NumberInput source="price" label="Цена" validate={validatePrice} />
      <NumberInput source="capacity" label="Грузоподъемность (кг)" />
      <TextInput source="dimensions" label="Размеры кузова" />
      
      <SelectInput source="availability" choices={[
        { id: 'in_stock', name: 'В наличии' },
        { id: 'days_1_3', name: '1-3 дня' },
        { id: 'days_7_14', name: '7-14 дней' }
      ]} />
      
      <NumberInput source="stock" label="Количество на складе" validate={validateStock} />
      
      <TextInput source="badge" label="Бейдж (Новинка/Хит)" />
      <TextInput source="image" label="URL изображения" fullWidth />
      <TextInput source="description" label="Описание" multiline fullWidth />
    </SimpleForm>
  </Edit>
);

export const TrailerCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="model" label="Модель" fullWidth validate={validateRequired} />
      <TextInput source="name" label="Название" fullWidth validate={validateRequired} />
      
      <SelectInput source="category" validate={validateRequired} choices={[
        { id: 'general', name: 'Универсальные' },
        { id: 'water', name: 'Лодочные' },
        { id: 'commercial', name: 'Коммерческие' }
      ]} />
      
      <NumberInput source="price" label="Цена" validate={validatePrice} />
      <NumberInput source="capacity" label="Грузоподъемность (кг)" />
      <TextInput source="dimensions" label="Размеры кузова" />
      
      <SelectInput source="availability" choices={[
        { id: 'in_stock', name: 'В наличии' },
        { id: 'days_1_3', name: '1-3 дня' },
        { id: 'days_7_14', name: '7-14 дней' }
      ]} defaultValue="in_stock" />
      
      <NumberInput source="stock" label="Количество на складе" validate={validateStock} />
      
      <TextInput source="badge" label="Бейдж (Новинка/Хит)" />
      <TextInput source="image" label="URL изображения" fullWidth />
      <TextInput source="description" label="Описание" multiline fullWidth />
    </SimpleForm>
  </Create>
);
