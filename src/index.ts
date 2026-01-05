import type { Env } from "./env";
import { detectTrack } from "./fields";
import { corsHeaders, jsonResponse, parseIncoming } from "./http";
import { createBitableRecord, getTenantAccessToken, uploadDriveFile } from "./lark";
import { buildApplicationsFields, buildMentorFields, buildVisionaryFields } from "./records";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/submit") {
      return new Response("Not Found", { status: 404, headers: corsHeaders(env) });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders(env) });
    }

    try {
      const fields = await parseIncoming(request);
      if (!fields || Object.keys(fields).length === 0) {
        return jsonResponse(env, 400, { ok: false, error: "Empty payload" });
      }

      const token = await getTenantAccessToken(env);
      const track = detectTrack(fields);
      if (!track) {
        return jsonResponse(env, 400, { ok: false, error: "Missing or invalid track" });
      }
      if (track === "Visionary") {
        const rawHeadshot = fields.headshot ?? fields.Headshot;
        const headshot = Array.isArray(rawHeadshot) ? rawHeadshot[0] : rawHeadshot;
        if (headshot instanceof File) {
          console.log("Uploading headshot", { name: headshot.name, size: headshot.size });
          try {
            const uploaded = await uploadDriveFile(env, token, headshot);
            console.log("Headshot uploaded", uploaded);
            fields.headshot = [uploaded];
            fields.Headshot = [uploaded];
          } catch (err) {
            console.error("Headshot upload error", err);
            throw err;
          }
        } else {
          console.log("No headshot file detected", {
            hasHeadshot: Boolean(rawHeadshot),
            headshotType: typeof rawHeadshot,
          });
        }
      }

      const applicationsResult = await createBitableRecord(
        env,
        token,
        env.APPLICATIONS_TABLE_ID,
        buildApplicationsFields(track, fields),
      );
      const applicationRecordId = applicationsResult?.data?.record?.record_id;
      if (!applicationRecordId) {
        throw new Error("Missing Application record_id");
      }

      let detailResult: any = null;
      if (track === "Visionary") {
        detailResult = await createBitableRecord(
          env,
          token,
          env.VISIONARY_TABLE_ID,
          buildVisionaryFields(applicationRecordId, fields),
        );
      } else {
        detailResult = await createBitableRecord(
          env,
          token,
          env.MENTOR_TABLE_ID,
          buildMentorFields(applicationRecordId, fields),
        );
      }

      return jsonResponse(env, 200, {
        ok: true,
        applicationsResult,
        detailResult,
      });
    } catch (err: any) {
      console.error("Submit handler error", err);
      return jsonResponse(env, 500, { ok: false, error: String(err?.message ?? err) });
    }
  },
};
