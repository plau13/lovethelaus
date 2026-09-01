import { requestSignIn } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; link?: string }>;
}) {
  const params = await searchParams;
  const link = params.link;

  return (
    <main className="grid max-w-lg gap-6">
      <h1 className="font-serif text-4xl">Sign in</h1>
      <p className="text-muted">
        No password. We email a link. On this computer the link also appears on the next screen so you can sign in
        without setting up mail yet.
      </p>
      {params.sent === "1" && link ? (
        <p className="rounded-xl border border-line bg-white p-4">
          Open this sign-in link:{" "}
          <a href={link} className="break-all">
            {link}
          </a>
        </p>
      ) : null}
      <form action={requestSignIn} className="grid gap-4">
        <label className="grid gap-1">
          <span>Your name</span>
          <input name="name" className="rounded-xl border border-line bg-white px-3 py-3" placeholder="Mom" />
        </label>
        <label className="grid gap-1">
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            className="rounded-xl border border-line bg-white px-3 py-3"
            placeholder="mom@example.com"
          />
        </label>
        <button type="submit" className="btn rounded-xl bg-clay px-5 py-3 text-lg text-white hover:bg-clay-dark">
          Send sign-in link
        </button>
      </form>
    </main>
  );
}
