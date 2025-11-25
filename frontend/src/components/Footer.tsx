export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold mb-4">EduVault</h3>
            <p className="text-sm">
              AI 기반 맞춤형 학습과 블록체인 저작권 보호
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">고객센터</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">공지사항</a></li>
              <li><a href="#" className="hover:text-white">자주묻는질문</a></li>
              <li><a href="#" className="hover:text-white">1:1 문의</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">이용약관</a></li>
              <li><a href="#" className="hover:text-white">개인정보처리방침</a></li>
              <li><a href="#" className="hover:text-white">청소년보호정책</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">회사정보</h4>
            <ul className="space-y-2 text-sm">
              <li>대표이사: 홍길동</li>
              <li>사업자등록번호: 123-45-67890</li>
              <li>통신판매업신고: 제2024-서울강남-12345호</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
          <p>&copy; 2024 EduVault. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
