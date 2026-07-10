function AddToCalendarButton() {
  const handleAddToCalendar = () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//youssefxsandra.com//Wedding//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:youssef-sandra-wedding-20260919@youssefxsandra.com",
      "DTSTAMP:20260101T000000Z",
      "DTSTART:20260919T123000",
      "DTEND:20260919T230000",
      "SUMMARY:Youssef & Sandra's Wedding",
      "DESCRIPTION:Ceremony at Saint Mary & Saint Athanasius Church (https://maps.google.com/?q=Saint+Mary+and+Saint+Athanasius+Church)\\, then a celebration at Dayra Camp (https://maps.google.com/?q=Dayra+Camp). RSVP: https://www.youssefxsandra.com",
      "LOCATION:Saint Mary & Saint Athanasius Church\\, then Dayra Camp",
      "URL:https://www.youssefxsandra.com",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "youssef-and-sandra-wedding.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <button
      type="button"
      onClick={handleAddToCalendar}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",

        borderRadius: 999,
        padding: "12px 26px",
        fontSize: "0.76rem",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        fontWeight: 600,
      }}
      className="z-[2] inline-block cursor-pointer rounded-full border border-sage  px-[1.5%] py-[2.5%] font-mulish text-[3.5vw] xs:text-[14px] font-semibold uppercase text-sage"
    >
      ADD TO CALENDAR
    </button>
  );
}

export default AddToCalendarButton;
