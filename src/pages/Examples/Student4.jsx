import React from 'react'

const Student4 = () => {
    const[visible, setVisible]=React.useState(true);

    const studentsList = [
        {name: 'Aarav', rollNumber: 1},
        {name: 'Diya', rollNumber: 2},
        {name: 'Kabir', rollNumber: 3},
        {name: 'Meera', rollNumber: 4},
        {name: 'Rohan', rollNumber: 5},
    ];
    const handleClick   =()=>{
        setVisible(!visible)
    };

    return (
    <div>
<button onClick={handleClick}>Toggle Students</button>
{visible && (
    <>
    {studentsList.map((s) => (
        <p>
            Roll Number: {s.rollNumber} <br />
            Name: {s.name} <br />
        </p>

    ))}
    </>
)}
    </div>
  )
}

export default Student4