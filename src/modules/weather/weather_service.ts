import { OpenWeatherAPI } from "openweather-api-node";

import { DateString } from "../../api/schema/util/dates";
import env from "../../envManager";
import { allDatesBetween, daysDifferenceBetween, formatDateData } from "../../utils/dates";
import { Coordinates } from "../../api/schema/util/weather";
import { UserEntity } from "../../models/entity/user_entity";
import moment from "moment-timezone";

const weatherInterface = new OpenWeatherAPI({
  key: env.openWeatherApiKey,
  lang: 'en',
  units: 'metric'
})

export class WeatherService {
  static async getWeather(user: UserEntity, start_date: DateString, end_date: DateString, coordinates: Coordinates) {
    const limit = daysDifferenceBetween(start_date, end_date);

    const today = formatDateData(moment().tz(user.timezone()).toDate());
    const historicDates = new Date(start_date) < new Date(today) ? allDatesBetween(start_date, today, true) : [];

    console.log('historic dates are', historicDates);
    console.log('requesting with coordinates', { coordinates });

    const relevantDates = (await Promise.all([
      ...historicDates.map((date) => weatherInterface.getHistory(date, { coordinates })),
      weatherInterface.getDailyForecast(limit, true, { coordinates })
    ])).flat()

    return relevantDates;
  }
}
