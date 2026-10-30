import UserFooter from "./userFooter";
import UserHeader from "./userHeader";

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
