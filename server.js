// Corrected URLs with versions
import { serve } from "https://deno.land/std@0.194.0/http/server.ts?s=serve";
import { serveDir } from "https://deno.land/std@0.194.0/http/file_server.ts?s=serveDir";
import { Client } from "https://deno.land/x/mysql@v2.11.0/mod.ts";
import "https://deno.land/std@0.193.0/dotenv/load.ts";
import { DIDAuth } from "https://jigintern.github.io/did-login/auth/DIDAuth.js";
import { addDID, checkIfIdExists, getUser,client as mySqlClient } from "./db-controller.js";

serve(async (req) => {
  const pathname = new URL(req.url).pathname;
  console.log(pathname);
  if (req.method === "POST" && pathname === "/users/logout") {
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET" && pathname === "/dream-title") {
    const dreams = await mySqlClient.query(
      "SELECT title FROM dreams WHERE dream_id = 58"
    );
    const title = dreams[0].title;
    return new Response(title);
  }

  if (req.method === "GET" && pathname === "/dream-content") {
    const dreams = await mySqlClient.query(
      "SELECT content FROM dreams WHERE dream_id = 58"
    );
    const content = dreams[0].content;
    return new Response(content);
  }

  /*
   * 夢の内容をPOSTする。
   */

  if (req.method === "POST" && pathname === "/dreams") {
    const reqJson = await req.json();
    console.log(reqJson);
    const titles = reqJson.titles;
    const contents = reqJson.contents;
    if (contents === "" && titles === "") {
      return new Response("空文字です。");
    } else {
      // INSERTなど、書込用SQLを実行する
      const insertResult = await mySqlClient.execute(
        `INSERT INTO dreams (title,content) VALUES (?,?);`,
        [titles, contents]
      );

      return new Response("文字です。");
    }
  }
  // New endpoint for fetching dreams
  /**
   * 投稿をGETする。
   */

  if (req.method === "GET" && pathname === "/dreams") {
    const dreams = await mySqlClient.query(
      "SELECT * FROM dreams ORDER BY timestamp DESC LIMIT 20"
    );
    // titleとcontentの両方を含むオブジェクトの配列を作成
    const result = dreams.map((dream) => ({
      title: dream.title,
      content: dream.content,
      dream_id: dream.dream_id,
    }));

    // JSON形式でResponseを返す
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }

  /* */

  if (req.method === "GET" && pathname.startsWith("/dreams/paginated")) {
    const params = new URLSearchParams(new URL(req.url).search);
    const page = parseInt(params.get("page") || "1");
    const limit = parseInt(params.get("limit") || "10");
    const offset = (page - 1) * limit;

    const dreams = await mySqlClient.query(
      "SELECT * FROM dreams ORDER BY timestamp DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const filteredDreams = dreams.map((dream) => ({
      dream_content: dream.dream_content,
      timestamp: dream.timestamp,
    }));
    return new Response(JSON.stringify(filteredDreams));
  }
  // Endpoint to retrieve comments for a specific dream
  if (
    req.method === "GET" &&
    pathname.startsWith("/dreams/") &&
    pathname.endsWith("/comments")
  ) {
    const dreamId = parseInt(pathname.split("/")[2]); // Assuming "/dreams/{dreamId}/comments" format

    const comments = await mySqlClient.query(
      "SELECT content FROM comments WHERE dream_id = ? ORDER BY timestamp DESC LIMIT 50",
      [dreamId]
    );

    return new Response(JSON.stringify(comments));
  }

  if (
    req.method === "POST" &&
    pathname.startsWith("/dreams/") &&
    pathname.endsWith("/comments")
  ) {
    const dreamId = parseInt(pathname.split("/")[2]);
    const reqJson = await req.json();
    const commentContent = reqJson.comment;

    if (commentContent === "") {
      return new Response("Comment cannot be empty.");
    } else {
      // Inserting comment into the comments table
      await mySqlClient.execute(
        `INSERT INTO comments (dream_id, content) VALUES (?, ?);`,
        [dreamId, commentContent]
      );

      // Appending the comment to the related_comment column in the dreams table
      const currentDream = await mySqlClient.query(
        "SELECT related_comment FROM dreams WHERE dream_id = ?",
        [dreamId]
      );

      const currentRelatedComments = currentDream[0].related_comment || "";
      const updatedComments = currentRelatedComments
        ? currentRelatedComments + "," + commentContent
        : commentContent;

      await mySqlClient.execute(
        "UPDATE dreams SET related_comment = ? WHERE dream_id = ?",
        [updatedComments, dreamId]
      );

      return new Response("Comment added successfully.");
    }
  }
    /**
     * 
     * 
     */

    if (req.method === "GET" && pathname.startsWith("pathname === /profile-name")) {
      
    }


  // Endpoint to retrieve comments for a specific dream
  if (req.method === "GET" && pathname.startsWith("/dreams/")) {
    const dreamId = parseInt(pathname.split("/")[2]); // Assuming "/dreams/{dreamId}/comments" format

    const comments = await mySqlClient.query(
      "SELECT * FROM dreams WHERE dream_id = ? ORDER BY timestamp ASC LIMIT 50",
      [dreamId]
    );

    return new Response(JSON.stringify(comments));
  }
  console.log("Attaching event to post-comment-button");
  // serve.js
  // ユーザー新規登録API
  if (req.method === "POST" && pathname === "/users/register") {
    const json = await req.json();
    const userName = json.name;
    const sign = json.sign;
    const did = json.did;
    const message = json.message;

    // 電子署名が正しいかチェック
    try {
      const chk = DIDAuth.verifySign(did, sign, message);
      if (!chk) {
        return new Response("不正な電子署名です", { status: 400 });
      }
    } catch (e) {
      return new Response("1", { status: 500 });
    }
    // 既にDBにDIDが登録されているかチェック
    try {
      const isExists = await checkIfIdExists(did);
      if (isExists) {
        return Response("登録済みです", { status: 400 });
      }
    } catch (e) {
      return new Response("2", { status: 500 });
    }

    // DBにDIDとuserNameを保存
    try {
      await addDID(did, userName);
      return new Response("ok");
    } catch (e) {
      return new Response("3", { status: 500 });
    }
  }

  //ログイン
  if (req.method === "POST" && pathname === "/users/login") {
    const json = await req.json();
    const sign = json.sign;
    const did = json.did;
    const message = json.message;

    // 電子署名が正しいかチェック
    try {
      const chk = DIDAuth.verifySign(did, sign, message);
      if (!chk) {
        return new Response("不正な電子署名です", { status: 400 });
      }
    } catch (e) {
      return new Response(e.message, { status: 400 });
    }

    // DBにdidが登録されているかチェック
    try {
      const isExists = await checkIfIdExists(did);
      if (!isExists) {
        return new Response("登録されていません", { status: 400 });
      }
      // 登録済みであればuser情報を返す
      const res = await getUser(did);
      const user = { did: res.rows[0].did, name: res.rows[0].name };
      return new Response(JSON.stringify({ user }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
});
