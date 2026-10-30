function UserCard({ name, age, location, isPremium }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "16px", margin: "10px" }}>
      <h1>{name}</h1>
      <p>Age: {age}</p>
      <p>Location: {location}</p>

      {isPremium ? (
        <p style={{ color: "gold", fontWeight: "bold" }}>VIP Member</p>
      ) : (
        <p>Standard Member</p>
      )}
    </div>
  );
}

function App() {
  return (
    <div>
      <UserCard
        name="Croissant Singh"
        age={23}
        location="Delhi"
        isPremium={true}
      />

      <UserCard
        name="Vinay Verma"
        age={21}
        location="Jaipur"
        isPremium={false}
      />

      <UserCard
        name="Croissant Singh"
        age={26}
        location="Bangalore"
        isPremium={true}
      />
    </div>
  );
}

export default App;
