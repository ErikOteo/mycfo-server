import api from "./gatewayApi.js";

export async function getReminders(userId) {
  const { data } = await api.get(`/users/${userId}/reminders`);
  return data;
}

export async function createReminder(userId, reminderData) {
  const { data } = await api.post(`/users/${userId}/reminders`, reminderData);
  return data;
}

export async function updateReminder(userId, reminderId, reminderData) {
  const { data } = await api.put(
    `/users/${userId}/reminders/${reminderId}`,
    reminderData
  );
  return data;
}

export async function deleteReminder(userId, reminderId) {
  await api.delete(`/users/${userId}/reminders/${reminderId}`);
}

export async function getReminder(userId, reminderId) {
  const { data } = await api.get(`/users/${userId}/reminders/${reminderId}`);
  return data;
}
