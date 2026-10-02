import { Client, TablesDB, Query, ID } from "appwrite";

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID = import.meta.env.VITE_APPWRITE_TABLE_ID;

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(PROJECT_ID);

const tablesDB = new TablesDB(client);


// ثبت یا افزایش تعداد سرچ
export const updateSearchCount = async (searchTerm, movie) => {
  try {
    const result = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      queries: [
        Query.equal("searchTerm", searchTerm),
      ],
    });

    // اگر سرچ قبلاً وجود داشته
    if (result.rows.length > 0) {
      const row = result.rows[0];

      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_ID,
        rowId: row.$id,
        data: {
          count: row.count + 1,
        },
      });

      console.log("Search count updated:", searchTerm);
    }

    // اگر سرچ برای اولین بار است
    else {
      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLE_ID,
        rowId: ID.unique(),
        data: {
          searchTerm: searchTerm,
          count: 1,
          movie_id: String(movie.id),
          poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        },
      });

      console.log("New search added:", searchTerm);
    }

  } catch (error) {
    console.error("Error updating search count:", error);
  }
};


// دریافت فیلم‌های Trending
export const getTrendingMovies = async () => {
  try {
    const result = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      queries: [
        Query.orderDesc("count"),
        Query.limit(5),
      ],
    });

    console.log("Trending rows:", result.rows);

    return result.rows;

  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
};