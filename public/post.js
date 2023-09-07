document.getElementById("post-button").onclick = async () => {
  const contents = document.getElementById("post-contents").value;
  const titles = document.getElementById("post-titles").value;

  try {
    const response = await fetch("/dreams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: contents, titles: titles }),
    });

  } catch (error) {
    console.error("Error posting dream:", error);
  }
};
