import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ensure user profile exists to prevent foreign key violations (self-healing)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    await supabase.from('profiles').insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || 'Student',
      email: user.email || '',
      role: 'student',
    })
  }

  // Check if notes are already seeded for this user
  const { data: existingNotes } = await supabase
    .from('notes')
    .select('id')
    .eq('uploaded_by', user.id)
    .limit(1)

  if (existingNotes && existingNotes.length > 0) {
    return NextResponse.json({ message: 'Notes already seeded for this user' })
  }

  // Get subject IDs
  const { data: subjects } = await supabase.from('subjects').select('*')
  if (!subjects || subjects.length === 0) {
    return NextResponse.json({ error: 'Please run supabase_setup.sql in Supabase SQL editor first.' }, { status: 400 })
  }

  const findSubjectId = (name: string) => {
    return subjects.find((s) => s.name.toLowerCase().includes(name.toLowerCase()))?.id || null
  }

  const demoNotes = [
    {
      title: 'Python Object-Oriented Programming (OOP)',
      description: 'Comprehensive notes covering classes, objects, inheritance, polymorphism, encapsulation, and abstraction in Python. Includes code examples and explanation of dunder methods.',
      subject_id: findSubjectId('Python'),
      topic: 'Object-Oriented Programming',
      branch: 'Computer Science & Engineering',
      semester: '3',
      tags: ['python', 'oop', 'programming', 'basics'],
      file_path: '/demo/python_oop.pdf',
      file_type: 'application/pdf',
      file_size: 154200,
      content_text: `Object-Oriented Programming (OOP) in Python is a programming paradigm that uses objects and classes. 
A class is a blueprint or template for creating objects. An object is an instance of a class.
Key Concepts of OOP:
1. Inheritance: Permitting a class to inherit attributes and methods from another class.
Example: class Student(Person): pass
2. Polymorphism: Allowing different classes to have methods with the same name but different implementations.
3. Encapsulation: Restricting direct access to some of the object's components, achieved using private members (double underscore prefix like __attribute).
4. Abstraction: Hiding implementation details and showing only functionality (using the abc module).
Special methods (dunder/magic methods) such as __init__, __str__, and __repr__ play an important role in Python OOP.`,
      uploaded_by: user.id,
      views: 45,
      downloads: 12,
      status: 'approved',
    },
    {
      title: 'Database Normalization and Normal Forms',
      description: 'Detailed study notes explaining 1NF, 2NF, 3NF, and BCNF with functional dependencies and schema decomposition examples.',
      subject_id: findSubjectId('Database'),
      topic: 'Database Normalization',
      branch: 'Computer Science & Engineering',
      semester: '4',
      tags: ['dbms', 'normalization', 'sql', 'database'],
      file_path: '/demo/dbms_normalization.pdf',
      file_type: 'application/pdf',
      file_size: 204800,
      content_text: `Database Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity.
Normal Forms:
1. First Normal Form (1NF): A table is in 1NF if it contains only atomic values and there are no repeating groups.
2. Second Normal Form (2NF): A table is in 2NF if it is in 1NF and all non-key attributes are fully functionally dependent on the primary key (no partial dependency).
3. Third Normal Form (3NF): A table is in 3NF if it is in 2NF and there is no transitive dependency of non-key attributes on the primary key.
4. Boyce-Codd Normal Form (BCNF): A stronger definition of 3NF where for every functional dependency X -> Y, X must be a super key.`,
      uploaded_by: user.id,
      views: 89,
      downloads: 34,
      status: 'approved',
    },
    {
      title: 'SQL Joins Explained Visual Guide',
      description: 'Quick reference sheet explaining Inner Join, Left Join, Right Join, Full Outer Join, and Self Join with Venn diagrams and syntax.',
      subject_id: findSubjectId('Database'),
      topic: 'SQL Joins',
      branch: 'Computer Science & Engineering',
      semester: '4',
      tags: ['sql', 'joins', 'dbms', 'queries'],
      file_path: '/demo/sql_joins.pdf',
      file_type: 'application/pdf',
      file_size: 89200,
      content_text: `SQL Joins are used to combine rows from two or more tables based on a related column between them.
Types of Joins:
1. INNER JOIN: Returns records that have matching values in both tables.
2. LEFT (OUTER) JOIN: Returns all records from the left table, and the matched records from the right table.
3. RIGHT (OUTER) JOIN: Returns all records from the right table, and the matched records from the left table.
4. FULL (OUTER) JOIN: Returns all records when there is a match in either left or right table.
5. SELF JOIN: A regular join, but the table is joined with itself.`,
      uploaded_by: user.id,
      views: 120,
      downloads: 50,
      status: 'approved',
    },
    {
      title: 'Operating System CPU Scheduling Algorithms',
      description: 'Compares FCFS, SJF, SRTF, Priority, and Round Robin scheduling algorithms with Gantt chart calculation examples.',
      subject_id: findSubjectId('Operating'),
      topic: 'CPU Scheduling',
      branch: 'Computer Science & Engineering',
      semester: '4',
      tags: ['os', 'cpu-scheduling', 'algorithms'],
      file_path: '/demo/os_scheduling.pdf',
      file_type: 'application/pdf',
      file_size: 245000,
      content_text: `CPU Scheduling is the process of deciding which process will run next in a multitasking operating system.
Key Scheduling Algorithms:
1. First-Come, First-Served (FCFS): Non-preemptive algorithm that schedules processes in the order of their arrival. Suffers from Convoy Effect.
2. Shortest Job First (SJF): Schedules the process with the shortest CPU burst time. Optimal but hard to predict burst time.
3. Shortest Remaining Time First (SRTF): Preemptive version of SJF.
4. Round Robin (RR): Each process is allocated a small time slice (time quantum) cyclically.
5. Priority Scheduling: Schedules processes based on priority. Can lead to starvation, resolved using aging.`,
      uploaded_by: user.id,
      views: 74,
      downloads: 18,
      status: 'approved',
    },
    {
      title: 'Computer Networks OSI 7-Layer Model',
      description: 'In-depth explanation of the OSI Model, covering the roles, protocols, and devices associated with each of the 7 layers.',
      subject_id: findSubjectId('Networks'),
      topic: 'OSI Model',
      branch: 'Computer Science & Engineering',
      semester: '5',
      tags: ['networks', 'osi-model', 'protocols', 'internet'],
      file_path: '/demo/networks_osi.pdf',
      file_type: 'application/pdf',
      file_size: 198000,
      content_text: `The Open Systems Interconnection (OSI) model is a conceptual framework that standardizes network communication into seven layers:
1. Physical Layer: Transmits raw bits over a physical medium (hub, cables, RJ45).
2. Data Link Layer: Standardizes node-to-node data transfer (MAC addresses, Ethernet, switches).
3. Network Layer: Handles routing and addressing across networks (IP addresses, routers).
4. Transport Layer: Manages end-to-end data delivery and error control (TCP, UDP).
5. Session Layer: Controls dialogues/connections between computers.
6. Presentation Layer: Translates, encrypts, and compresses data (SSL/TLS, JPEG).
7. Application Layer: High-level protocols used by user software (HTTP, FTP, SMTP).`,
      uploaded_by: user.id,
      views: 110,
      downloads: 40,
      status: 'approved',
    },
    {
      title: 'HTML5 & CSS3 Basics for Web Design',
      description: 'A study sheet covering HTML5 semantic elements, CSS selectors, Flexbox, CSS Grid, and responsive media queries.',
      subject_id: findSubjectId('Web'),
      topic: 'HTML & CSS',
      branch: 'Computer Science & Engineering',
      semester: '2',
      tags: ['html', 'css', 'web-dev', 'frontend'],
      file_path: '/demo/web_basics.pdf',
      file_type: 'application/pdf',
      file_size: 135000,
      content_text: `HTML5 introduces semantic tags to make code more readable and improve SEO. Key tags include <header>, <nav>, <section>, <article>, <aside>, and <footer>.
CSS3 Flexbox and CSS Grid are modern layout models:
- Flexbox is one-dimensional (row or column). Useful for components.
  Properties: display: flex, justify-content, align-items.
- Grid is two-dimensional (rows and columns). Useful for overall page structures.
  Properties: display: grid, grid-template-columns.
Responsive Design is achieved using viewport meta tags and Media Queries:
@media (min-width: 768px) { ... }`,
      uploaded_by: user.id,
      views: 65,
      downloads: 25,
      status: 'approved',
    },
    {
      title: 'Data Structures - Arrays and Matrices',
      description: 'Revision notes explaining array representations, contiguous memory allocation, multi-dimensional array formulas, and basic operations.',
      subject_id: findSubjectId('Data'),
      topic: 'Arrays',
      branch: 'Computer Science & Engineering',
      semester: '3',
      tags: ['dsa', 'arrays', 'data-structures', 'basics'],
      file_path: '/demo/dsa_arrays.pdf',
      file_type: 'application/pdf',
      file_size: 167000,
      content_text: `An Array is a collection of elements stored at contiguous memory locations. It is a linear data structure.
Key operations on arrays:
- Traversal: Accessing each element in sequence. (O(n))
- Insertion: Adding an element at a specific index. (O(n) in worst case due to shifting)
- Deletion: Removing an element at a specific index. (O(n) due to shifting)
- Search: Finding the index of an element. (O(n) for linear search, O(log n) for binary search on sorted array)
Row-Major and Column-Major formulas are used to calculate the address of elements in a two-dimensional array.`,
      uploaded_by: user.id,
      views: 92,
      downloads: 28,
      status: 'approved',
    },
  ]

  const { error } = await supabase.from('notes').insert(demoNotes)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Seeded demo notes successfully!' })
}
