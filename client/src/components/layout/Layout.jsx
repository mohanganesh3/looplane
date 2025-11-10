import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children, showFooter = true, adminTheme = false }) => {
  return (
    <div className={`min-h-screen flex flex-col ${adminTheme ? 'bg-gray-100' : ''}`}>
      <Navbar adminTheme={adminTheme} />
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer adminTheme={adminTheme} />}
    </div>
  );
};

export default Layout;
