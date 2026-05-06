// 자격취득년도 추출 유틸리티
export function extractLicenseYear(licenseNumber: string | null, licenseDate: string | null) {
  const FIRST_EXAM_YEAR = 1985 // 제1회 공인중개사 자격시험 년도
  let year: number | null = null

  // 1단계: 자격번호에서 "XX-YYYY-XXXXX" 패턴의 YYYY 추출
  if (licenseNumber) {
    const licensePattern = licenseNumber.match(/^\D*(\d{1,2})-(\d{4})-/)
    if (licensePattern && licensePattern[2]) {
      const candidateYear = parseInt(licensePattern[2], 10)
      if (candidateYear >= FIRST_EXAM_YEAR && candidateYear <= new Date().getFullYear()) {
        year = candidateYear
      }
    }
  }

  // 2단계: 패턴이 없으면 자격번호에서 모든 4자리 숫자 추출
  if (!year && licenseNumber) {
    const matches = licenseNumber.match(/(\d{4})/g)
    if (matches) {
      for (const match of matches) {
        const num = parseInt(match, 10)
        if (num >= FIRST_EXAM_YEAR && num <= new Date().getFullYear()) {
          year = num
          break
        }
      }
    }
  }

  // 3단계: 자격번호에서 못 찾으면 licenseDate 사용 (단, 1970-01-01은 제외)
  if (!year && licenseDate) {
    const dateYear = new Date(licenseDate).getFullYear()
    // 1970-01-01은 Unix 기준시간이므로 데이터 오류 → null로 처리
    if (licenseDate !== '1970-01-01' && dateYear !== 1970) {
      year = dateYear
    }
  }

  if (!year) {
    return { year: null, career: '-', isInvalid: false, errorMessage: null }
  }

  // 연도가 1985년 이전이면 데이터 오류
  if (year < FIRST_EXAM_YEAR) {
    const errorMsg = `공인중개사 제도 시행 전 연도입니다. 원자료 오류 또는 누락값 가능성이 있습니다.`
    return { year, career: '-', isInvalid: true, errorMessage: errorMsg }
  }

  const careerYears = new Date().getFullYear() - year
  return { year, career: `${careerYears}년`, isInvalid: false, errorMessage: null }
}
