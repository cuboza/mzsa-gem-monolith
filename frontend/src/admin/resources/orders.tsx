import {
  List, Datagrid, TextField, DateField, EditButton,
  Edit, SimpleForm, TextInput, SelectInput, NumberField,
  FunctionField, Filter, SearchInput
} from 'react-admin';

const OrderFilter = (props: any) => (
  <Filter {...props}>
    <SearchInput source="q" alwaysOn placeholder="Поиск..." />
    <SelectInput source="status" choices={[
      { id: 'new', name: 'Новый' },
      { id: 'processing', name: 'В работе' },
      { id: 'shipping', name: 'В пути' },
      { id: 'ready', name: 'Готов' },
      { id: 'completed', name: 'Завершен' },
      { id: 'cancelled', name: 'Отменен' },
    ]} />
  </Filter>
);

export const OrderList = () => (
  <List filters={<OrderFilter />} sort={{ field: 'date', order: 'DESC' }}>
    <Datagrid rowClick="edit">
      <TextField source="orderNumber" label="Номер" />
      <TextField source="customer.name" label="Клиент" />
      <TextField source="customer.phone" label="Телефон" />
      <TextField source="configuration.trailer.model" label="Прицеп" />
      <NumberField 
        source="configuration.totalPrice" 
        label="Сумма" 
        options={{ style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }}
      />
      <FunctionField 
        label="Статус" 
        render={(record: any) => {
          const colors: Record<string, string> = {
            new: 'blue', processing: 'orange', shipping: 'purple', 
            ready: 'green', completed: 'gray', cancelled: 'red'
          };
          return <span style={{ color: colors[record.status] }}>{record.status}</span>;
        }} 
      />
      <DateField source="date" showTime label="Дата" />
      <EditButton />
    </Datagrid>
  </List>
);

export const OrderEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="orderNumber" disabled label="Номер заказа" />
      <DateInput source="date" disabled label="Дата создания" />
      
      <SelectInput 
        source="status" 
        choices={[
          { id: 'new', name: 'Новый' },
          { id: 'processing', name: 'В работе' },
          { id: 'shipping', name: 'В пути' },
          { id: 'ready', name: 'Готов к выдаче' },
          { id: 'completed', name: 'Завершен' },
          { id: 'cancelled', name: 'Отменен' },
        ]} 
      />

      <div className="bg-gray-50 p-4 rounded mb-4 w-full">
        <h3 className="text-lg font-bold mb-2">Данные клиента</h3>
        <TextInput source="customer.name" label="Имя" fullWidth />
        <TextInput source="customer.phone" label="Телефон" fullWidth />
        <TextInput source="customer.email" label="Email" fullWidth />
        <TextInput source="customer.city" label="Город" />
      </div>

      <TextInput source="manager" label="Менеджер" fullWidth />
      <TextInput source="notes" multiline label="Заметки" fullWidth />
    </SimpleForm>
  </Edit>
);

// Вспомогательный компонент для даты, так как DateInput в RA v4 требует специального формата или преобразования
const DateInput = (props: any) => <TextInput {...props} type="datetime-local" />;

