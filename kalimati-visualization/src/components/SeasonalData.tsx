"use client";

import { getEvergreenItemsTableData, getOtherItemsTableData, seasonMostCommon } from "@/app/actions";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  Tabs,
  Tab,
} from "@nextui-org/react";
import { Fragment, useEffect, useState } from "react";
import { InfoIcon, TimelineIcon } from "./Icons";
import PriceHistory from "./PriceHistory";

export default function SeasonData() {
  const [seasonData, setSeasonData] = useState({});
  const [family, setFamily] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [data, setData] = useState<any[]>([]);

  async function getData() {
    const ret = await seasonMostCommon();
    console.log(ret);
    setSeasonData(ret);
    setData([
      {
        id: "evergreen",
        label: "Evergreen Items",
        content: await getEvergreenItemsTableData(),
      },
      {
        id: "other",
        label: "Other Items",
        content: await getOtherItemsTableData(),
      },
    ]);
  }

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl">
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Price History for {family}
              </ModalHeader>
              <ModalBody>
                <PriceHistory family={family} />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      <Tabs fullWidth className="pt-5 w-full" aria-label="Commodity Type" items={data}>
        {(item) => (
          <Tab className="w-full" key={item.id} title={item.label}>
            <Table
              isHeaderSticky
              aria-label="Price Table"
              className="w-full max-h-[80vh] overflow-y-auto"
              >
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>PRICE (Rs.)</TableColumn>
                <TableColumn>
                  <Tooltip content="Compared to Yesterday's Prices" showArrow={true}>
                    <div className="flex flex-row items-center gap-3 w-full">
                      <p>%</p>
                      <InfoIcon size={16} />
                    </div>
                  </Tooltip>
                </TableColumn>
                <TableColumn>GRAPH</TableColumn>
              </TableHeader>
              <TableBody items={item.content}>
                {(item: any) => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Tooltip
                        content={
                          <div>
                            {item.commodities.map(
                              (
                                commodity: { name: any; price: any },
                                index: number
                              ) => (
                                <Fragment key={index}>
                                  {commodity.name}: {commodity.price}
                                  <br />
                                </Fragment>
                              )
                            )}
                          </div>
                        }
                        showArrow={true}
                      >
                        <div className="flex flex-row items-center gap-3 w-full">
                          <p>{item.average}</p>
                          <InfoIcon size={14} />
                        </div>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <p
                        className={
                          item.changeSign === -1
                          ? "text-green-600"
                            : item.changeSign === 1
                            ? "text-red-600"
                            : ""
                        }
                      >
                        {item.changePercent}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        color="default"
                        variant="faded"
                        onPress={() => {
                          setFamily(item.name);
                          onOpen();
                        }}
                      >
                        <TimelineIcon size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Tab>
        )}
      </Tabs>
    </>
  );
}
