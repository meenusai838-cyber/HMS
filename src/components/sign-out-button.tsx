import { logoutAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <Button variant="outline" size="sm" type="submit">
        Sign out
      </Button>
    </form>
  );
}
