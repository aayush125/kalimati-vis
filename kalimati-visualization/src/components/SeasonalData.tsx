"use client";

import { getCommonItemsTableData, seasonMostCommon } from "@/app/actions";
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
    setData(await getCommonItemsTableData());
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
      <Table
        isHeaderSticky
        aria-label="Price Table"
        className="max-h-96 overflow-y-auto w-full bg-white"
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
        <TableBody items={data}>
          {(item) => (
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
                      ? "text-green-300"
                      : item.changeSign === 1
                      ? "text-red-300"
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
    </>
  );
}
