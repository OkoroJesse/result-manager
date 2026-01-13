import { ResultService } from './src/services/result.service';

async function testSubmit() {
    const session_id = '24ecbade-36f5-4524-9dfa-73d64ec59307';
    const term_id = 'e5a5efb1-ce99-470d-996e-12e7ea45991c';
    const class_id = '3c535ab5-18ca-45ee-ac2f-d5be1c975c5a';
    const subject_id = 'f069d586-9617-447f-8ab2-ae923a64cb0f';
    const teacher_id = '907455fd-ebb5-408f-adb5-ef0bf5614654';

    console.log('Testing submitResults with:');
    console.log({ session_id, term_id, class_id, subject_id, teacher_id });

    try {
        const result = await ResultService.submitResults(session_id, term_id, class_id, subject_id, teacher_id);
        console.log('Success:', result);
    } catch (e: any) {
        console.log('FAILED:', e.message);
    }
}
testSubmit();
