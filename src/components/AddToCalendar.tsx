function AddToCalendarButton() {
  const handleAddToCalendar = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // iOS: Use .ics file - opens directly in Calendar app
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//youssefxsandra.com//Wedding//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        "UID:youssef-sandra-wedding-20260919@youssefxsandra.com",
        "DTSTAMP:20260101T000000Z",
        "DTSTART:20260919T100000Z",
        "DTEND:20260919T213000Z",
        "SUMMARY:Youssef & Sandra's Wedding",
        "DESCRIPTION:Ceremony at Saint Mary & Saint Athanasius Church (https://maps.app.goo.gl/6woycMKqk1pQKuCx8), then a celebration at Dayra Camp (https://maps.app.goo.gl/oDrmBMTqqEdjBbreA). RSVP: https://www.youssefxsandra.com",
        "LOCATION:Saint Mary & Saint Athanasius Church, then Dayra Camp",
        "URL:https://www.youssefxsandra.com",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");

      const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
      window.location.href = dataUri;
    } else {
      // Android & Desktop: Use Google Calendar link
      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: "Youssef & Sandra's Wedding",
        dates: "20260919T100000Z/20260919T213000Z",
        details:
          "Ceremony at Saint Mary & Saint Athanasius Church (https://maps.app.goo.gl/6woycMKqk1pQKuCx8), then a celebration at Dayra Camp (https://maps.app.goo.gl/oDrmBMTqqEdjBbreA). RSVP: https://www.youssefxsandra.com",
        location: "Saint Mary & Saint Athanasius Church, then Dayra Camp",
        ctz: "Africa/Cairo",
      });
      window.open(
        `https://calendar.google.com/calendar/render?${params.toString()}`,
        "_blank",
      );
    }
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
