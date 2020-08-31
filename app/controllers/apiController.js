const Student = require('../models/student.model.js');
const Teacher = require('../models/teacher.model.js');

exports.register = async (req, res) => {
    console.log('sudent---register-->>> ', req.body);
    if (!req.body.teacher || (req.body.students && !req.body.students.length)) {
        return res.status(400).send({
            message: "Please provide students and teacher properly."
        });
    }
    let { teacher, students } = req.body;

    let isTeacherALreadyExits = await Teacher.findOne({ 'email': teacher }, '_id name email students');
    if (!isTeacherALreadyExits) {
        var newteacher = await createTeacher({ teacherToCreate: teacher });
    }
    let teacherToAssign = isTeacherALreadyExits || newteacher;
    let newStudentList = await createStudentIfNotExists({ studentList: students, teacherToAssign });
    if (newStudentList && teacherToAssign) {
        await updateStudentListInTeacher({ studentToAdd: newStudentList, teacherToAssign });
    }
    return res.status(204).send({
        message: "Success."
    });
};

const createStudentIfNotExists = async (params) => {
    let { studentList, teacherToAssign } = params;
    let newStudentList = [];

    if (!Array.isArray(studentList)) {
        studentList = [{ ...studentList }];
    }

    const promises = studentList.map(async student => {
        let isStudentFound = await Student.findOne({ 'email': student }, '_id name email teachers');
        if (!isStudentFound) {
            let newStudent = await createStudent({ studentToCreate: student, teacherToAssign });
            newStudentList.push(newStudent);
        } else {
            await updateTeacherListInStudent({ student: isStudentFound, teacherToAssign });
            newStudentList.push(isStudentFound);
        }
        return newStudentList;
    })
    await Promise.all(promises)
    console.log('newStudentList-->>> ', newStudentList);
    return newStudentList;
}

const createStudent = async ({ studentToCreate, teacherToAssign }) => {
    let teacherDataForStudent = { [teacherToAssign._id]: teacherToAssign.email };
    try {
        let student = new Student({
            email: studentToCreate,
            teachers: teacherDataForStudent
        });
        student = await student.save()
        return student;
    } catch (err) {
        throw err.message;
    };
}

const createTeacher = async ({ teacherToCreate }) => {
    try {
        let teacher = new Teacher({
            email: teacherToCreate,
        });
        teacher = await teacher.save()
        return teacher;
    } catch (err) {
        throw err.message;
    };
}

const updateStudentListInTeacher = async ({ studentToAdd, teacherToAssign }) => {
    try {
        let newStudentList = {};
        if (teacherToAssign && teacherToAssign.students) {
            newStudentList = { ...teacherToAssign.students };
        }
        if (studentToAdd) {
            studentToAdd.map(student => {
                newStudentList = {
                    ...newStudentList,
                    [student._id]: student.email
                };
            })
        }

        let updateTeacher = await Teacher.findByIdAndUpdate(teacherToAssign._id, {
            students: newStudentList
        }, { new: true });

        return updateTeacher;
    } catch (err) {
        throw err;
    }
}

const updateTeacherListInStudent = async ({ student, teacherToAssign }) => {
    try {
        if (student && teacherToAssign) {

            let updateTeacherList = {};
            if (student.teachers) {
                updateTeacherList = { ...student.teachers };
            }
            if (Array.isArray(teacherToAssign)) {
                teacherToAssign.map(teacher => {
                    updateTeacherList = {
                        ...updateTeacherList,
                        [teacher._id]: teacher.email
                    };
                })
            } else {
                updateTeacherList = {
                    ...updateTeacherList,
                    [teacherToAssign._id]: teacherToAssign.email
                };
            }

            await Student.findByIdAndUpdate(student._id, {
                teachers: updateTeacherList
            }, { new: true });
        }
        return;
    } catch (err) {
        throw err.message;
    }
}

exports.commonStudents = async (req, res) => {
    let { teacher } = req.query;

    let commonStudentList = [];
    if (Array.isArray(teacher)) {
        const promises = teacher.map(async t => {
            let isTeacherFound = await Teacher.findOne({ 'email': t }, '_id name email students');
            if (isTeacherFound && isTeacherFound.students && isTeacherFound.students) {
                Object.values(isTeacherFound.students).map(stu => {
                    if (commonStudentList.indexOf(stu) === -1) {
                        commonStudentList.push(stu);
                    }
                })
            }
            return commonStudentList;
        })
        // wait until all promises resolve
        await Promise.all(promises);
    } else {
        let isTeacherFound = await Teacher.findOne({ 'email': teacher }, '_id name email students');
        if (isTeacherFound && isTeacherFound.students && isTeacherFound.students) {
            Object.values(isTeacherFound.students).map(stu => {
                if (commonStudentList.indexOf(stu) === -1) {
                    commonStudentList.push(stu);
                }
            })
        }
    }
    console.log('commonStudents final List----->>> ', commonStudentList);
    return commonStudentList;
}

exports.suspend = async (req, res) => {
    let { student } = req.body;

    let isStudentALreadyExits = await Student.findOne({ 'email': student }, '_id name email teachers');
    if (!isStudentALreadyExits) {
        return res.status(404).send({
            message: "Student Not Found."
        });
    }

    let suspendDetail = {
        suspended: true,
        suspendedOn: new Date()
    }
    Student.updateOne({ _id: isStudentALreadyExits.id }, { $set: { suspend: suspendDetail } }, function (err, result) {
        if (err) {
            throw err;
        }
        return res.status(204).send({
            message: "Student Suspended."
        });
    });
}

exports.retrievefornotifications = async (req, res) => {
    let { teacher, notification } = req.body;

    let isTeacherALreadyExits = await Teacher.findOne({ 'email': teacher }, '_id name email students');
    if (!isTeacherALreadyExits) {
        return res.status(404).send({
            message: "Teacher Not Found."
        });;
    }

    let studentsAssignedToTeacher = Object.values(isTeacherALreadyExits.students) || [];
    var emailsFromNotificationIfExists = [...studentsAssignedToTeacher];
    notification.split(" ").filter(function (word, index) {
        var pattern = new RegExp(".com", "g");
        if (word.match(pattern)) {
            let extractedEmail = word.substring(1);
            if (emailsFromNotificationIfExists.indexOf(extractedEmail) == -1) {
                emailsFromNotificationIfExists.push(extractedEmail);
            }
            return true;
        } else {
            return false;
        }
    });
    let StudentListToReturn = [];
    const promises = emailsFromNotificationIfExists.map(async student => {
        let isStudentALreadyExits = await Student.findOne({ 'email': student, suspend: { $exists: false } }, '_id name email teachers');
        if(isStudentALreadyExits){
            StudentListToReturn.push(student);
        }
        return StudentListToReturn;
    })
    await Promise.all(promises)
    console.log('StudentListToReturn-->>>>> ', StudentListToReturn);
    return res.status(204).send({ emailsFromNotificationIfExists });
}