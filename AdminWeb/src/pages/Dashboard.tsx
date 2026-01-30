import React from 'react';
import { Card, Col, Row, Statistic, Table, Typography } from 'antd';
import { Users, Gamepad2, Flag, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const { Title } = Typography;

const data = [
  { name: 'Mon', users: 400, zones: 240 },
  { name: 'Tue', users: 300, zones: 139 },
  { name: 'Wed', users: 200, zones: 980 },
  { name: 'Thu', users: 278, zones: 390 },
  { name: 'Fri', users: 189, zones: 480 },
  { name: 'Sat', users: 239, zones: 380 },
  { name: 'Sun', users: 349, zones: 430 },
];

const Dashboard: React.FC = () => {
  const columns = [
    {
      title: 'Username',
      dataData: 'username',
      key: 'username',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ];

  const dataSource = [
    { key: '1', username: 'pro_gamer', status: 'Active', createdAt: '2026-01-20' },
    { key: '2', username: 'noob_master', status: 'Banned', createdAt: '2026-01-21' },
    { key: '3', username: 'queen_bee', status: 'Active', createdAt: '2026-01-22' },
  ];

  return (
    <div className="space-y-6">
      <Title level={2}>Dashboard Overview</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Total Users"
              value={1250}
              prefix={<Users className="mr-2 text-blue-500" size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Active Zones"
              value={45}
              prefix={<Gamepad2 className="mr-2 text-green-500" size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Pending Reports"
              value={12}
              valueStyle={{ color: '#cf1322' }}
              prefix={<Flag className="mr-2 text-red-500" size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Growth Rate"
              value={15.4}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<TrendingUp className="mr-2" size={20} />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="User Activity (Last 7 Days)" bordered={false} className="shadow-sm">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#E94560" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Zones Created" bordered={false} className="shadow-sm">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="zones" stroke="#22D1EE" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Recent Registered Users" bordered={false} className="shadow-sm">
        <Table dataSource={dataSource} columns={columns} pagination={false} />
      </Card>
    </div>
  );
};

export default Dashboard;
