import {
  List, Datagrid, TextField, DateField, EditButton,
  Edit, SimpleForm, TextInput, SelectInput, NumberField,
  FunctionField, Filter, SearchInput, NumberInput,
  ArrayInput, SimpleFormIterator,
  TopToolbar, Button, useRecordContext, useNotify,
  required, BulkDeleteButton, BulkExportButton, DeleteWithConfirmButton
} from 'react-admin';
import { FileText, Printer } from 'lucide-react';

// Bulk Actions для заказов
const OrderBulkActions = () => (
  <>
    <BulkExportButton />
    <BulkDeleteButton mutationMode="pessimistic" />
  </>
);

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
    <SelectInput source="paymentStatus" choices={[
      { id: 'unpaid', name: 'Не оплачено' },
      { id: 'partial', name: 'Частично' },
      { id: 'paid', name: 'Оплачено' },
    ]} />
  </Filter>
);

const OrderEditActions = () => {
  const notify = useNotify();
  return (
    <TopToolbar>
      <Button label="Счёт на оплату" onClick={() => {
        notify('Генерация счета... (в разработке)', { type: 'info' });
      }}>
        <FileText size={18} className="mr-2" />
      </Button>
      <Button label="Печать" onClick={() => window.print()}>
        <Printer size={18} className="mr-2" />
      </Button>
    </TopToolbar>
  );
};

const TotalPriceField = () => {
  const record = useRecordContext();
  if (!record) return null;
  
  const trailerPrice = record.configuration?.trailer?.price || 0;
  const accessoriesPrice = record.configuration?.accessories?.reduce((sum: number, acc: any) => sum + (Number(acc.price) || 0), 0) || 0;
  const discount = record.configuration?.discount || 0;
  const manualPrice = record.configuration?.manualPrice;
  
  const calculatedTotal = trailerPrice + accessoriesPrice - discount;
  const finalPrice = manualPrice !== undefined && manualPrice !== null ? manualPrice : calculatedTotal;

  return (
    <div className="text-xl font-bold mt-4 p-4 bg-green-50 border border-green-200 rounded">
      Итого к оплате: {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(finalPrice)}
      {manualPrice && <div className="text-xs text-gray-500 font-normal">(Установлена ручная цена)</div>}
    </div>
  );
};

export const OrderList = () => (
  <List filters={<OrderFilter />} sort={{ field: 'date', order: 'DESC' }}>
    <Datagrid rowClick="edit" bulkActionButtons={<OrderBulkActions />}>
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
          return <span style={{ color: colors[record.status], fontWeight: 'bold' }}>{record.status}</span>;
        }} 
      />
      <FunctionField 
        label="Оплата" 
        render={(record: any) => {
          const colors: Record<string, string> = {
            unpaid: 'red', partial: 'orange', paid: 'green'
          };
          const labels: Record<string, string> = {
            unpaid: 'Не оплачено', partial: 'Частично', paid: 'Оплачено'
          };
          const status = record.paymentStatus || 'unpaid';
          return <span style={{ color: colors[status], border: `1px solid ${colors[status]}`, padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em' }}>
            {labels[status]}
          </span>;
        }} 
      />
      <DateField source="date" showTime label="Дата" />
      <EditButton />
      <DeleteWithConfirmButton confirmTitle="Удалить заказ?" confirmContent="Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить." />
    </Datagrid>
  </List>
);

export const OrderEdit = () => (
  <Edit actions={<OrderEditActions />} mutationMode="pessimistic">
    <SimpleForm>
      <div className="flex gap-4 w-full">
        <div className="flex-1">
          <TextInput source="orderNumber" disabled label="Номер заказа" fullWidth />
        </div>
        <div className="flex-1">
          <DateInput source="date" disabled label="Дата создания" fullWidth />
        </div>
      </div>
      
      <div className="flex gap-4 w-full">
        <div className="flex-1">
          <SelectInput 
            source="status" 
            label="Статус заказа"
            fullWidth
            validate={required('Выберите статус')}
            choices={[
              { id: 'new', name: 'Новый' },
              { id: 'processing', name: 'В работе' },
              { id: 'shipping', name: 'В пути' },
              { id: 'ready', name: 'Готов к выдаче' },
              { id: 'completed', name: 'Завершен' },
              { id: 'cancelled', name: 'Отменен' },
            ]} 
          />
        </div>
        <div className="flex-1">
          <SelectInput 
            source="paymentStatus" 
            label="Статус оплаты"
            fullWidth
            defaultValue="unpaid"
            choices={[
              { id: 'unpaid', name: 'Не оплачено' },
              { id: 'partial', name: 'Частично' },
              { id: 'paid', name: 'Оплачено' },
            ]} 
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded mb-4 w-full border border-blue-100">
        <h3 className="text-lg font-bold mb-2 text-blue-800">Данные клиента</h3>
        <div className="grid grid-cols-2 gap-4">
          <TextInput source="customer.name" label="Имя" fullWidth />
          <TextInput source="customer.phone" label="Телефон" fullWidth />
          <TextInput source="customer.email" label="Email" fullWidth />
          <TextInput source="customer.city" label="Город" fullWidth />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded mb-4 w-full border border-gray-200">
        <h3 className="text-lg font-bold mb-2 text-gray-800">Состав заказа</h3>
        
        <div className="mb-4 p-3 bg-white rounded border">
          <h4 className="font-semibold mb-2">Прицеп</h4>
          <div className="flex gap-4">
            <TextInput source="configuration.trailer.model" label="Модель" fullWidth />
            <NumberInput source="configuration.trailer.price" label="Цена" />
          </div>
        </div>

        <h4 className="font-semibold mb-2">Аксессуары и опции</h4>
        <ArrayInput source="configuration.accessories" label=" ">
          <SimpleFormIterator inline>
            <TextInput source="name" label="Название" />
            <NumberInput source="price" label="Цена" />
          </SimpleFormIterator>
        </ArrayInput>

        <div className="mt-4 grid grid-cols-2 gap-4 bg-white p-3 rounded border">
          <NumberInput source="configuration.discount" label="Скидка (руб)" />
          <NumberInput source="configuration.manualPrice" label="Ручная цена (override)" />
        </div>

        <TotalPriceField />
      </div>

      <TextInput source="manager" label="Менеджер" fullWidth />
      <TextInput source="notes" multiline label="Заметки" fullWidth />
    </SimpleForm>
  </Edit>
);

// Вспомогательный компонент для даты, так как DateInput в RA v4 требует специального формата или преобразования
const DateInput = (props: any) => <TextInput {...props} type="datetime-local" />;

