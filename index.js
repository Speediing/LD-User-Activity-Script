const { default: axios } = require("axios");
const { createObjectCsvWriter } = require("csv-writer/dist");

const getAuthToken = async () => {
  const response = await axios.put(
    "https://app.launchdarkly.com/internal/account/login",
    {
      username: "ENTER USERNAME",
      password: "ENTER PASSWORD",
    },
    { withCredentials: true }
  );
  let data;
  try {
    data = response.headers["set-cookie"][0];
  } catch (error) {
    console.log(error);
  }
  return data;
};

const getUserSeenData = async (cookie, url) => {
  const response = await axios.get(url, {
    withCredentials: true,
    headers: {
      Cookie: cookie,
    },
  });
  let data;
  try {
    data = response;
  } catch (error) {
    console.log(error);
  }
  return data;
};

const createUserCsv = async (users) => {
  const csvWriter = createObjectCsvWriter({
    path: "out.csv",
    header: [
      { id: "lastSeen", title: "Last Seen" },
      { id: "email", title: "Email" },
    ],
  });

  await csvWriter.writeRecords(users);
};

const getUserData = async () => {
  let authToken = await getAuthToken();
  let users = [];
  let url =
    "https://app.launchdarkly.com/api/v2/user-search/default/production?sort=-lastSeen";
  while (url) {
    let userData = await getUserSeenData(authToken, url);
    let items = [];
    userData.data.items.forEach((item) => {
      items.push({
        lastSeen: item.lastPing,
        email: item.user.key,
      });
    });
    users = [...users, ...items];
    try {
      url = `https://app.launchdarkly.com${userData.data._links.next.href}`;
    } catch (error) {
      url = undefined;
    }
  }
  createUserCsv(users);
};

getUserData();
