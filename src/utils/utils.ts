const NSEHolidayList = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-01-15", name: "Municipal Corporation Election - Maharashtra" },
  { date: "2026-01-26", name: "Republic Day" },
  { date: "2026-03-03", name: "Holi" },
  { date: "2026-03-26", name: "Shri Ram Navami" },
  { date: "2026-03-31", name: "Shri Mahavir Jayanti" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-14", name: "Dr. Baba Saheb Ambedkar Jayanti" },
  { date: "2026-05-01", name: "Maharashtra Day" },
  { date: "2026-05-28", name: "Bakri Id" },
  { date: "2026-06-26", name: "Muharram" },
  { date: "2026-09-14", name: "Ganesh Chaturthi" },
  { date: "2026-10-02", name: "Mahatma Gandhi Jayanti" },
  { date: "2026-10-20", name: "Dussehra" },
  { date: "2026-11-08", name: "Diwali Laxmi Pujan" },
  { date: "2026-11-10", name: "Diwali-Balipratipada" },
  { date: "2026-11-24", name: "Prakash Gurpurb Sri Guru Nanak Dev" },
  { date: "2026-12-25", name: "Christmas" },
];

export const isTodayHoliday = (): { isHoliday: boolean; name?: string } => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;

  const holiday = NSEHolidayList.find((h) => h.date === dateString);

  if (holiday) {
    return { isHoliday: true, name: holiday.name };
  }

  return { isHoliday: false };
};
