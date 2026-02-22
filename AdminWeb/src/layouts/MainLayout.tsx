import React, { useState } from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  Flag,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut
} from 'lucide-react';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
    },
    {
      key: '/users',
      icon: <Users size={20} />,
      label: 'Users',
    },
    {
      key: '/games',
      icon: <Gamepad2 size={20} />,
      label: 'Games',
    },
    {
      key: '/reports',
      icon: <Flag size={20} />,
      label: 'Reports',
    },
    {
      key: '/settings',
      icon: <Settings size={20} />,
      label: 'Settings',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div className="flex items-center justify-center h-16 m-4 bg-opacity-20 bg-white rounded-lg">
          <span className={`text-white font-bold text-xl ${collapsed ? 'hidden' : 'block'}`}>
            TEAMZONEVN
          </span>
          <span className={`text-white font-bold text-xl ${collapsed ? 'block' : 'hidden'}`}>
            TZ
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ paddingRight: 24 }}>
            <Button type="text" icon={<LogOut size={20} />} className="flex items-center gap-2">
              Logout
            </Button>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
