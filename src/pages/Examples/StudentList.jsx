import Student3 from '../../components/Student3';


function StudentList({students}) {
    const filteredStudents = students.filter(student => {return student.percentage > 33.0;
    });
    return (
        <>
        <h2>
            Passed Student List
        </h2>
        {filteredStudents.map((student, index) => (
            <Student3
                key={index}
                name = {student.name}
                rollNumber = {student.rollNumber}
                percentage = {student.percentage}
            />
        ))}
        </>
    );
}
export default StudentList;