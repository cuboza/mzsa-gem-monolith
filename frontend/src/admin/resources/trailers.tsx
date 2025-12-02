import {
  List, Datagrid, TextField, NumberField, EditButton,
  Edit, SimpleForm, TextInput, SelectInput, NumberInput,
  Filter, SearchInput, Create, FunctionField,
  required, minValue, DeleteWithConfirmButton,
  BulkDeleteButton, BulkExportButton, BooleanInput, BooleanField
} from 'react-admin';

// Валидаторы
const validateRequired = required('Обязательное поле');
const validatePrice = [required('Обязательное поле'), minValue(0, 'Цена не может быть отрицательной')];
const validateStock = minValue(0, 'Остаток не может быть отрицательным');

// Хелпер для отображения наличия
const getAvailabilityLabel = (availability: string, stock?: number) => {
  // Если есть остаток > 0, показываем "В наличии"
  if (stock && stock > 0) {
    return 'В наличии';
  }
  // Иначе по значению availability
  switch (availability) {
    case 'in_stock': return 'В наличии';
    case 'days_1_3': return '1-3 дня';
    case 'days_7_14': return '7-14 дней';
    default: return 'Под заказ';
  }
};

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
      <NumberField source="stock" label="Остаток" emptyText="0" />
      <BooleanField source="isVisible" label="Видим" />
      <FunctionField 
        label="Наличие" 
        render={(record: any) => {
          const label = getAvailabilityLabel(record?.availability, record?.stock);
          const isInStock = (record?.stock && record.stock > 0) || record?.availability === 'in_stock';
          return (
            <span style={{ 
              padding: '2px 8px', 
              borderRadius: 4, 
              backgroundColor: isInStock ? '#dcfce7' : '#fef3c7',
              color: isInStock ? '#166534' : '#92400e',
              fontSize: 12,
              fontWeight: 500
            }}>
              {label}
            </span>
          );
        }}
      />
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
      
      <NumberInput source="stock" label="Остаток на складе" validate={validateStock} helperText="При остатке > 0 статус автоматически 'В наличии'" />
      
      <SelectInput source="availability" label="Статус наличия (если остаток = 0)" choices={[
        { id: 'in_stock', name: 'В наличии' },
        { id: 'days_1_3', name: '1-3 дня' },
        { id: 'days_7_14', name: '7-14 дней' }
      ]} />
      
      <BooleanInput source="isVisible" label="Видимость в каталоге" defaultValue={true} helperText="Показывать в каталоге и конфигураторе" />
      
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
      
      <NumberInput source="stock" label="Остаток на складе" validate={validateStock} defaultValue={0} helperText="При остатке > 0 статус автоматически 'В наличии'" />
      
      <SelectInput source="availability" label="Статус наличия (если остаток = 0)" choices={[
        { id: 'in_stock', name: 'В наличии' },
        { id: 'days_1_3', name: '1-3 дня' },
        { id: 'days_7_14', name: '7-14 дней' }
      ]} defaultValue="days_7_14" />
      
      <BooleanInput source="isVisible" label="Видимость в каталоге" defaultValue={true} helperText="Показывать в каталоге и конфигураторе" />
      
      <TextInput source="badge" label="Бейдж (Новинка/Хит)" />
      <TextInput source="image" label="URL изображения" fullWidth />
      <TextInput source="description" label="Описание" multiline fullWidth />
    </SimpleForm>
  </Create>
);
