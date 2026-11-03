import UserFooter from "./UserFooter";
import UserHeader from "./UserHeader";

function UserLayout({ user, children }) {
  return (
    <>
      <UserHeader user={user} />
      {children}
      <UserFooter />
    </>
  );
}

export default UserLayout;
