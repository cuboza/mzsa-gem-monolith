import { 
  Edit, 
  TabbedForm, 
  FormTab, 
  TextInput, 
  ArrayInput, 
  SimpleFormIterator, 
  BooleanInput,
  SelectInput
} from 'react-admin';

export const SettingsEdit = () => (
  <Edit title="Настройки сайта">
    <TabbedForm>
      <FormTab label="Контакты">
        <TextInput source="contacts.phone" label="Основной телефон" fullWidth />
        <TextInput source="contacts.email" label="Email для клиентов" fullWidth />
        <TextInput source="contacts.orderEmail" label="Email для заявок" fullWidth />
        <TextInput source="contacts.workHours" label="Режим работы" fullWidth />
        
        <ArrayInput source="contacts.addresses" label="Адреса магазинов">
          <SimpleFormIterator>
            <SelectInput source="region" label="Регион" choices={[
              { id: 'ХМАО', name: 'ХМАО' },
              { id: 'ЯНАО', name: 'ЯНАО' },
            ]} />
            <TextInput source="city" label="Город" />
            <TextInput source="address" label="Адрес" fullWidth />
          </SimpleFormIterator>
        </ArrayInput>
      </FormTab>

      <FormTab label="Соцсети">
        <TextInput source="social.whatsapp" label="WhatsApp (номер)" fullWidth helperText="Например: 79991234567" />
        <TextInput source="social.telegram" label="Telegram (username)" fullWidth helperText="Например: onr_shop" />
        <TextInput source="social.vk" label="ВКонтакте (ссылка)" fullWidth />
        <TextInput source="social.youtube" label="YouTube (ссылка)" fullWidth />
      </FormTab>

      <FormTab label="SEO и Метрика">
        <TextInput source="seo.defaultTitle" label="Заголовок сайта (Suffix)" fullWidth />
        <TextInput source="seo.defaultDescription" label="Meta Description (по умолчанию)" multiline fullWidth />
        <TextInput source="seo.yandexMetrikaId" label="ID Яндекс.Метрики" fullWidth />
      </FormTab>

      <FormTab label="Уведомления">
        <BooleanInput source="notifications.emailEnabled" label="Отправлять уведомления на Email" />
        <TextInput source="notifications.telegramChatId" label="Telegram Chat ID" fullWidth helperText="ID чата для уведомлений о заказах" />
      </FormTab>

      <FormTab label="О компании">
        <TextInput source="about.description" label="Описание в футере" multiline fullWidth />
        <ArrayInput source="about.advantages" label="Преимущества (список)">
          <SimpleFormIterator>
            <TextInput source="" label="Текст преимущества" fullWidth />
          </SimpleFormIterator>
        </ArrayInput>
      </FormTab>
    </TabbedForm>
  </Edit>
);

