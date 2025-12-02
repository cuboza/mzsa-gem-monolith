import {
  List, Datagrid, TextField, NumberField, EditButton, BooleanField,
  Edit, SimpleForm, TextInput, NumberInput, BooleanInput, Create, FunctionField,
  required, minValue, DeleteWithConfirmButton,
  BulkDeleteButton, BulkExportButton, Filter, SearchInput, SelectInput,
  ArrayInput, SimpleFormIterator, AutocompleteArrayInput, useGetList
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

// Фильтр аксессуаров
const AccessoryFilter = () => (
  <Filter>
    <SearchInput source="q" alwaysOn placeholder="Поиск..." />
    <SelectInput source="category" label="Категория" choices={[
      { id: 'loading', name: 'Погрузка' },
      { id: 'support', name: 'Опоры' },
      { id: 'spare', name: 'Запчасти' },
      { id: 'cover', name: 'Тенты' },
      { id: 'safety', name: 'Безопасность' },
      { id: 'guides', name: 'Направляющие' },
      { id: 'boat_support', name: 'Лодочные опоры' },
    ]} />
  </Filter>
);

// Поле для отображения совместимости
const CompatibilityField = () => {
  const { data: trailers } = useGetList('trailers', { 
    pagination: { page: 1, perPage: 200 },
    sort: { field: 'model', order: 'ASC' }
  });
  
  return (
    <FunctionField
      label="Совместимость"
      sortable={true}
      sortBy="compatibility"
      render={(record: any) => {
        const compat = record?.compatibility || record?.compatibleWith || [];
        if (!compat || compat.length === 0) return <span style={{ color: '#9ca3af' }}>—</span>;
        
        // Универсальные категории
        const categories: Record<string, string> = {
          'all': 'Все',
          'general': 'Универсальные',
          'water': 'Лодочные',
          'commercial': 'Коммерческие',
        };
        
        // Получаем список для отображения
        const items = compat.map((c: string) => {
          if (categories[c]) return categories[c];
          // Ищем прицеп по ID
          const trailer = trailers?.find((t: any) => t.id === c);
          return trailer?.model || c;
        });
        
        // Сортируем и показываем первые 3
        const sorted = items.sort();
        const display = sorted.slice(0, 3).join(', ');
        const rest = sorted.length > 3 ? ` +${sorted.length - 3}` : '';
        
        return (
          <span title={sorted.join(', ')} style={{ fontSize: 12 }}>
            {display}{rest && <span style={{ color: '#6b7280' }}>{rest}</span>}
          </span>
        );
      }}
    />
  );
};

export const AccessoryList = () => (
  <List filters={<AccessoryFilter />} sort={{ field: 'stock', order: 'DESC' }}>
    <Datagrid rowClick="edit" bulkActionButtons={<AccessoryBulkActions />}>
      <ThumbnailField source="image" />
      <TextField source="name" label="Название" sortable={true} />
      <TextField source="category" label="Категория" sortable={true} />
      <NumberField source="price" label="Цена" options={{ style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }} sortable={true} />
      <NumberField source="stock" label="Остаток" sortable={true} />
      <CompatibilityField />
      <BooleanField source="isUniversal" label="Универсальный" sortable={true} />
      <EditButton />
      <DeleteWithConfirmButton confirmTitle="Удалить аксессуар?" confirmContent="Вы уверены, что хотите удалить этот аксессуар?" />
    </Datagrid>
  </List>
);

// Компонент для выбора совместимых прицепов
const CompatibilityInput = () => {
  const { data: trailers } = useGetList('trailers', { 
    pagination: { page: 1, perPage: 200 },
    sort: { field: 'model', order: 'ASC' }
  });
  
  const choices = [
    { id: 'all', name: '🌐 Все прицепы' },
    { id: 'general', name: '📦 Универсальные (категория)' },
    { id: 'water', name: '🚤 Лодочные (категория)' },
    { id: 'commercial', name: '🚛 Коммерческие (категория)' },
    ...(trailers?.map((t: any) => ({ id: t.id, name: t.model })) || [])
  ];
  
  return (
    <AutocompleteArrayInput 
      source="compatibility" 
      label="Совместимость с прицепами"
      choices={choices}
      fullWidth
      helperText="Выберите категории или конкретные модели прицепов"
    />
  );
};

export const AccessoryEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm>
      <TextInput source="name" label="Название" fullWidth validate={validateRequired} />
      <SelectInput source="category" label="Категория" choices={[
        { id: 'loading', name: 'Погрузка' },
        { id: 'support', name: 'Опоры' },
        { id: 'spare', name: 'Запчасти' },
        { id: 'cover', name: 'Тенты' },
        { id: 'safety', name: 'Безопасность' },
        { id: 'guides', name: 'Направляющие' },
        { id: 'boat_support', name: 'Лодочные опоры' },
      ]} />
      <NumberInput source="price" label="Цена" validate={validatePrice} />
      <NumberInput source="stock" label="Количество на складе" validate={validateStock} />
      <TextInput source="description" label="Описание" multiline fullWidth />
      <TextInput source="image" label="URL изображения" fullWidth />
      <CompatibilityInput />
      <BooleanInput source="isUniversal" label="Универсальный (для всех прицепов)" />
    </SimpleForm>
  </Edit>
);

export const AccessoryCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Название" fullWidth validate={validateRequired} />
      <SelectInput source="category" label="Категория" choices={[
        { id: 'loading', name: 'Погрузка' },
        { id: 'support', name: 'Опоры' },
        { id: 'spare', name: 'Запчасти' },
        { id: 'cover', name: 'Тенты' },
        { id: 'safety', name: 'Безопасность' },
        { id: 'guides', name: 'Направляющие' },
        { id: 'boat_support', name: 'Лодочные опоры' },
      ]} />
      <NumberInput source="price" label="Цена" validate={validatePrice} />
      <NumberInput source="stock" label="Количество на складе" validate={validateStock} />
      <TextInput source="description" label="Описание" multiline fullWidth />
      <TextInput source="image" label="URL изображения" fullWidth />
      <CompatibilityInput />
      <BooleanInput source="isUniversal" label="Универсальный (для всех прицепов)" defaultValue={true} />
    </SimpleForm>
  </Create>
);
