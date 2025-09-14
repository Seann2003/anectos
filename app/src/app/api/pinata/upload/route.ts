import { pinata } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: "Missing file details" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let response;
    if (files.length === 1) {
      response = await pinata.upload.file(files[0]);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to upload to Pinata" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
