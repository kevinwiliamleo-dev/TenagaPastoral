import { QuestionType } from "@prisma/client"

export const QUESTION_TEMPLATES = {
  pastoral_standard: {
    name: "Standar Evaluasi Pastoral",
    description: "Template standar untuk evaluasi tenaga pastoral",
    questions: [
      { text: "Bagaimana konsistensi dalam melaksanakan tugas pelayanan harian?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana kualitas dalam memimpin ibadah dan liturgi?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana pelayanan dalam pendampingan umat yang membutuhkan?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana kedalaman kehidupan doa dan spiritualitas pribadi?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana komitmen dalam meditasi dan refleksi Kitab Suci?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana kemampuan dalam memimpin tim dan menggerakkan umat?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana kemampuan mengambil keputusan dalam situasi sulit?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana ketepatan dalam pengelolaan administrasi dan dokumentasi?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana kemampuan membangun relasi yang sehat dengan sesama?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana usaha dalam mengembangkan pengetahuan dan keterampilan?", type: "SCALE_1_TO_5" as const },
    ]
  },
  pastoral_comprehensive: {
    name: "Evaluasi Pastoral Komprehensif",
    description: "Template lengkap dengan pertanyaan lebih detail dan teks",
    questions: [
      { text: "Bagaimana kedalaman dan konsistensi kehidupan doa sehari-hari?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana komitmen dalam meditasi dan kontemplasi Kitab Suci?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana kualitas dalam mempersiapkan dan memimpin liturgi?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana efektivitas dalam pelayanan pastoral kepada umat?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana kemampuan dalam berkhotbah dan mengajar?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana visi dan kemampuan strategis dalam memimpin?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana kemampuan mendelegasikan tugas dan memberdayakan tim?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana ketertiban dalam pencatatan dan dokumentasi kegiatan?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana kemampuan berkomunikasi dengan berbagai kalangan?", type: "SCALE_1_TO_5" as const },
      { text: "Apa kekuatan utama dalam pelayanan pastoral?", type: "TEXT" as const, isRequired: false },
      { text: "Saran pengembangan untuk periode berikutnya:", type: "TEXT" as const, isRequired: false },
    ]
  },
  pastoral_simple: {
    name: "Evaluasi Pastoral Sederhana",
    description: "Template ringkas dengan pertanyaan inti",
    questions: [
      { text: "Bagaimana kualitas kehidupan rohani dan spiritualitas?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana kualitas dan dedikasi dalam pelayanan pastoral?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana kemampuan kepemimpinan dan pengambilan keputusan?", type: "SCALE_1_TO_5" as const },
      { text: "Bagaimana kualitas hubungan dengan sesama dan umat?", type: "SCALE_1_TO_5" as const },
      { text: "Apakah rekomendasikan untuk masa jabatan berikutnya?", type: "BOOLEAN" as const },
    ]
  }
}
