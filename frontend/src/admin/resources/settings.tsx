import { Edit, SimpleForm, TextInput, ArrayInput, SimpleFormIterator } from 'react-admin';

export const SettingsEdit = () => (
  <Edit title="Настройки сайта">
    <SimpleForm>
      <h3>Контакты</h3>
      <TextInput source="contacts.phone" label="Телефон" fullWidth />
      <TextInput source="contacts.email" label="Email" fullWidth />
      <TextInput source="contacts.workHours" label="Часы работы" fullWidth />
      
      <h3>О компании</h3>
      <TextInput source="about.description" label="Описание" multiline fullWidth />
      
      <ArrayInput source="about.advantages" label="Преимущества">
        <SimpleFormIterator>
          <TextInput source="" label="Преимущество" fullWidth />
        </SimpleFormIterator>
      </ArrayInput>
    </SimpleForm>
  </Edit>
);
