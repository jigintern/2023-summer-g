window.onload = async () => {
  /**
   * /index.htmlでの処理
   */
  if (
    window.location.pathname === "/" ||
    window.location.pathname === "/index.html"
  ) {
    localStorage.removeItem("dream_id");
    try {
      const response = await fetch("/dreams");

      const result = await response.text();
      const data = JSON.parse(result);

      const parentDiv = document.getElementById("get-contents");
      for (let i = 0; i < data.length; i++) {
        // dreams1, dreams2, ... のようなdiv要素を作成
        const dreamDiv = document.createElement("div");
        dreamDiv.setAttribute("class", `dreams`);
        parentDiv.appendChild(dreamDiv);

        // dream-title1, dream-title2, ... のようなdiv要素をdreamDivの子要素として作成
        const dreamTitleDiv = document.createElement("div");
        dreamTitleDiv.setAttribute("id", `dream-title${i}`);
        dreamTitleDiv.textContent = data[i].title; // タイトル名を挿入
        dreamDiv.appendChild(dreamTitleDiv);

        // dream-content1, dream-content2, ... のようなdiv要素をdreamDivの子要素として作成
        const dreamContentDiv = document.createElement("div");
        dreamContentDiv.setAttribute("id", `dream-content${i}`);
        dreamContentDiv.textContent = data[i].content; // 夢の内容を挿入
        dreamDiv.appendChild(dreamContentDiv);
        dreamDiv.onclick = async () => {
          localStorage.setItem("dream_id", data[i].dream_id);
          console.log(data[i].dream_id);
          window.location.href = `./post-detail.html`;
        };
      }
    } catch (error) {
      console.error("Error fetching from /post:", error);
    }
  }

  if (window.location.pathname === "/post-detail.html") {
    try {
      const response = await fetch("/dream-title");
      document.getElementById("dream-title").innerText = await response.text();
    } catch (error) {
      console.error("Error fetching from /dream-title:", error);
    }

    try {
      const response = await fetch("");
      document.getElementById("dream-content").innerText =
        await response.text();
    } catch (error) {
      console.error("Error fetching from /dream-title:", error);
    }
  }

    try {
      const response = await fetch("/profile-name");
      const result = await response.text();
      const data = JSON.parse(result);

      const name = document.getElementById("user-circle");


    } catch (error) {

  }

};

// document.getElementById("fetch-dreams-button").onclick = async () => {
//   try {
//     const response = await fetch("/dreams");
//     const dreams = await response.json();
//     console.log(dreams);
//     const userIds = dreams.map((dream) => dream.title);
//     document.getElementById("dreams-container").innerText = userIds.join(", ");
//   } catch (error) {
//     console.error("Error fetching dreams:", error);
//   }
// };
