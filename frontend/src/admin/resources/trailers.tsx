import {
  List, Datagrid, TextField, NumberField, EditButton,
  Edit, SimpleForm, TextInput, SelectInput, NumberInput,
  Filter, SearchInput, Create
} from 'react-admin';

const TrailerFilter = (props: any) => (
  <Filter {...props}>
    <SearchInput source="q" alwaysOn placeholder="Поиск модели..." />
    <SelectInput source="category" choices={[
      { id: 'general', name: 'Дачные' },
      { id: 'moto', name: 'Мототехника' },
      { id: 'water', name: 'Лодочные' },
      { id: 'commercial', name: 'Коммерческие' },
      { id: 'wrecker', name: 'Эвакуаторы' }
    ]} />
  </Filter>
);

export const TrailerList = () => (
  <List filters={<TrailerFilter />}>
    <Datagrid rowClick="edit">
      <TextField source="model" label="Модель" />
      <TextField source="name" label="Название" />
      <TextField source="category" label="Категория" />
      <NumberField source="price" label="Цена" options={{ style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }} />
      <TextField source="availability" label="Наличие" />
      <EditButton />
    </Datagrid>
  </List>
);

export const TrailerEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="model" label="Модель" fullWidth />
      <TextInput source="name" label="Название" fullWidth />
      
      <SelectInput source="category" choices={[
        { id: 'general', name: 'Дачные' },
        { id: 'moto', name: 'Мототехника' },
        { id: 'water', name: 'Лодочные' },
        { id: 'commercial', name: 'Коммерческие' },
        { id: 'wrecker', name: 'Эвакуаторы' }
      ]} />
      
      <NumberInput source="price" label="Цена" />
      <NumberInput source="capacity" label="Грузоподъемность (кг)" />
      <TextInput source="dimensions" label="Размеры кузова" />
      
      <SelectInput source="availability" choices={[
        { id: 'in_stock', name: 'В наличии' },
        { id: 'days_1_3', name: '1-3 дня' },
        { id: 'days_7_14', name: '7-14 дней' }
      ]} />
      
      <TextInput source="badge" label="Бейдж (Новинка/Хит)" />
    </SimpleForm>
  </Edit>
);

export const TrailerCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="model" label="Модель" fullWidth />
      <TextInput source="name" label="Название" fullWidth />
      
      <SelectInput source="category" choices={[
        { id: 'general', name: 'Дачные' },
        { id: 'moto', name: 'Мототехника' },
        { id: 'water', name: 'Лодочные' },
        { id: 'commercial', name: 'Коммерческие' },
        { id: 'wrecker', name: 'Эвакуаторы' }
      ]} />
      
      <NumberInput source="price" label="Цена" />
      <NumberInput source="capacity" label="Грузоподъемность (кг)" />
      <TextInput source="dimensions" label="Размеры кузова" />
      
      <SelectInput source="availability" choices={[
        { id: 'in_stock', name: 'В наличии' },
        { id: 'days_1_3', name: '1-3 дня' },
        { id: 'days_7_14', name: '7-14 дней' }
      ]} defaultValue="in_stock" />
      
      <TextInput source="badge" label="Бейдж (Новинка/Хит)" />
    </SimpleForm>
  </Create>
);

