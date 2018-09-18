DEPOK_PRAYER_TIME_CALENDAR = "oh36m4na22s0npc8j7t6kl1ago@group.calendar.google.com";

function doit() {
//  getPrayerTimesKemenag("depok");
  getPrayerTimesSiswadi("Depok");
}

// this needs to be run daily
// https://gist.github.com/siswadi/b24f13ddc80eb92e0b01a8a595c32433
function getPrayerTimesSiswadi(city) {
  var calendar = getCalendarForCity(city);
  // e.g. city = Depok or Jakarta or Tokyo
  var url = "https://time.siswadi.com/pray/" + city;

  var response = UrlFetchApp.fetch(url)
  Logger.log("response = " + response.getContentText())
  var responseObject = JSON.parse(response)
  if (responseObject.data) {
    var date = responseObject.time.date
    var prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]
    for (var idx in prayers) {
      var prayer = prayers[idx]
      var time = responseObject.data[prayer]
      var timestamp = new Date(date + "T" + time + ":00+07:00")
      var endTimestamp = addMinutes(timestamp, 15)
      Logger.log("prayer " + prayer + " start = " + timestamp + ", end = " + endTimestamp)

      if(!isExists(calendar, prayer, timestamp)) {
        Logger.log("creating event for prayer %s", prayer)
        calendar.createEvent(prayer, timestamp, endTimestamp);
        Utilities.sleep(1000)
      } else {
        Logger.log("already exists for waktu %s at %s", prayer, timestamp)
      }
    }
  }
}

function getPrayerTimesKemenag(city) {
  var now = new Date();
  var headers = {
    "Referer": "http://sihat.kemenag.go.id/waktu-sholat"
  }
  var payload = {
    "tahun": now.getYear().toFixed(),
    "bulan": (now.getMonth() + 1).toFixed(),
    "h": "0",
    "lokasi": getKemenagCityId(city)
  }
  var url = "http://sihat.kemenag.go.id/site/get_waktu_sholat"
  var params = {
    "method": "post",
    "headers": headers,
    "payload": payload
  }
  var response = UrlFetchApp.fetch(url, params)
  var calendar = getCalendarForCity(city);
  Logger.log("response = " + response.getContentText())
  var dataAll = JSON.parse(response.getContentText());
  for (var tanggal in dataAll.data) {
    if (!dataAll.data.hasOwnProperty(tanggal)) continue;

    var today = dataAll.data[tanggal]
    for (var waktu in today) {
      if (!today.hasOwnProperty(waktu)) continue;
      if (["subuh", "dzuhur", "ashar", "maghrib", "isya"].indexOf(waktu) == -1) continue;
      var jam = today[waktu]
      var timestamp = new Date(formatDate(tanggal) + " " + jam + " GMT+7")
      var endTime = addMinutes(timestamp, 10);
      Logger.log(waktu + "  " + timestamp)
      if(!isExists(calendar, waktu, timestamp)) {
        Logger.log("creating event for waktu %s", waktu)
        calendar.createEvent(waktu, timestamp, endTime);
        Utilities.sleep(1000)
      } else {
        Logger.log("already exists for waktu %s at %s", waktu, timestamp)
      }
    }
  }
}

function getPrayerTimes(city) {
  var now = new Date();
  var currentDate = now.getDate() + "-" + (now.getMonth() + 1) + "-" + now.getYear();
  var calendar = getCalendarForCity(city);
  var response = UrlFetchApp.fetch("http://muslimsalat.com/"+city+"/monthly.json?key=0361d72a68a03e12616f777efb08f736&date=");
  var dataAll = JSON.parse(response.getContentText());
  for(var i = 0 ; i < dataAll.items.length ; i ++) {
    var prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    for(var j = 0 ;  j < prayers.length; j ++) {
      var time = parseDate(dataAll.items[i].date_for, dataAll.items[i][prayers[j]], dataAll.timezone);
      if(!isExists(calendar, prayers[j], time)) {
        Logger.log("Creating event: " + prayers[j] + " at " + time);
        var event = calendar.createEvent(prayers[j], time, time);
        Utilities.sleep(1000);
      }
    }
  }
  Logger.log(dataAll);
}

function isExists(calendar, eventName, time) {
  var endTime = addMinutes(time, 30)
  var events = calendar.getEvents(time, endTime);
  for(var i = 0 ; i < events.length ; i ++) {
    if(events[i].getTitle() == eventName) return true;
  }
  return false;
}

function capitalize(s) {
    // returns the first letter capitalized + the string from index 1 and out aka. the rest of the string
    return s[0].toUpperCase() + s.substr(1);
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}
function remove_all() {
  var city = "depok";
  var calendar = getCalendarForCity(city);
  calendar.getEvents(new Date("2018-02-01"), addDays(new Date(), 30)).forEach(function(event){
      Logger.log(event.getTitle() + "-" + event.getDescription());
      event.deleteEvent();
      Utilities.sleep(1000)
  })
}

function formatDate(date) {
  return date.replace(/-/g, "/")
}
function getKemenagCityId(city) {
  var mapping = {
    "depok": "VnYCZQk1UiNTIQBjDDUHMAN3ATVSPVI5UTMGK1c0WmVQMlJmWmJVYwFmVWIMYgNp"
  }
  return mapping[city];
}

function parseDate(date, time, timezone) {
  var months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var dateData = date.split("-");
  var timeData = time.split(" ");
  var hour = parseInt(timeData[0].split(":")[0]);
  var minute = parseInt(timeData[0].split(":")[1]);
  if (timeData[1] == 'pm' && hour < 12) hour += 12;
  var zone = timezone > 0 ? ("UTC+" + timezone) : ("UTC" + timezone);
  return new Date(months[dateData[1]] + ' ' + dateData[2] + ', ' + dateData[0] + ' ' + hour +':' + minute +':00 ' + zone);
}

function getCalendarForCity(cityName) {
  var calendarName = capitalize(cityName) + " Prayer Time";
  var cals = CalendarApp.getCalendarsByName(calendarName);
  if (cals.length == 0) {
    return CalendarApp.createCalendar(calendarName);
  } else {
    return cals[0];
  }
}

function deleteCalendar(id) {
  CalendarApp.getCalendarById(id).deleteCalendar();
}
