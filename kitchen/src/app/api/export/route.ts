import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toCsv } from "@/lib/export";
import {
  buildCookbookExport,
  buildSingleRecipeExport,
  buildUserExportPayload,
  canExportCookbook,
  canExportRecipe,
  recipesForExport,
} from "@/lib/export-eligibility";
import { slugify } from "@/lib/slug";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const recipeId = request.nextUrl.searchParams.get("recipeId");
  const cookbookId = request.nextUrl.searchParams.get("cookbookId");

  if (cookbookId) {
    const allowed = await canExportCookbook(user.id, cookbookId);
    if (!allowed) {
      return NextResponse.json({ error: "You cannot export this cookbook." }, { status: 403 });
    }

    const payload = await buildCookbookExport(user.id, cookbookId);
    const filename = `cookbook-${cookbookId}.json`;

    if (format === "csv") {
      const csv = toCsv(payload);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename.replace(".json", ".csv")}"`,
        },
      });
    }

    return NextResponse.json(payload, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  if (recipeId) {
    const access = await canExportRecipe(user.id, recipeId);
    if (!access.allowed) {
      return NextResponse.json({ error: "You cannot export this recipe." }, { status: 403 });
    }

    const payload = await buildSingleRecipeExport(user.id, recipeId);
    const recipe = payload.recipes[0];
    const filename = `${slugify(recipe?.title ?? "recipe")}.json`;

    return NextResponse.json(payload, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const payload = await buildUserExportPayload(user.id);

  if (format === "csv") {
    const csv = toCsv(payload);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="kitchen-recipes.csv"',
      },
    });
  }

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": 'attachment; filename="kitchen-recipes.json"',
    },
  });
}

export async function HEAD(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse(null, { status: 401 });
  }
  const recipes = await recipesForExport(user.id);
  return NextResponse.json({ count: recipes.length });
}
